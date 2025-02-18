const fs = require('fs');
const path = require('path');

// 定义路径
const jsonFilePath = path.join(__dirname, '../../cache/imgur/database.json'); // JSON 文件路径 @:root/cache/imgur/database.json
const imgurDirectory = path.join(__dirname, '../../cache/imgur'); // /imgur 目录路径 @:root/cache/imgur
const cacheDirectory = path.join(__dirname, '../../cache'); // /cache 目录路径 @:root/cache

// 读取 JSON 数据
function readJsonData() {
    try {
        const data = fs.readFileSync(jsonFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return [];
    }
}

// 获取所有有效的文件路径
function getValidPaths(data) {
    const validPaths = new Set();
    data.forEach(item => {
        for (const key in item) {
            item[key].forEach(file => {
                validPaths.add(path.join(cacheDirectory, file.path));
            });
        }
    });
    return validPaths;
}

// 递归遍历目录并删除无效文件
function cleanUpFiles(dir, validPaths) {
    // 读取目录内容
    fs.readdir(dir, (err, files) => {
        if (err) {
            console.error('Error reading directory:', dir, err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(dir, file);

            // 忽略 database.json 文件
            if (file === 'database.json') {
                return;
            }

            // 检查是文件还是文件夹
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', filePath, err);
                    return;
                }

                if (stats.isDirectory()) {
                    // 如果是文件夹，递归遍历
                    cleanUpFiles(filePath, validPaths);
                } else if (stats.isFile()) {
                    // 如果是文件，检查是否在有效路径中
                    if (!validPaths.has(filePath)) {
                        fs.unlink(filePath, err => {
                            if (err) {
                                console.error('Error deleting file:', filePath, err);
                            } else {
                                console.log('Deleted:', filePath);
                            }
                        });
                    }
                }
            });
        });
    });
}

// 主函数
function main() {
    const jsonData = readJsonData();
    const validPaths = getValidPaths(jsonData);

    // 开始清理
    cleanUpFiles(imgurDirectory, validPaths);
}

// 定时任务（每 60 分钟执行一次）
//const interval = 60 * 60 * 1000 * 12; // 12 小时
//setInterval(main, interval);

function startInterval(clearIntervalId, interval) {
    if (!clearIntervalId) {
        clearIntervalId = setInterval(main, interval);
    }
}

module.exports = { main, startInterval };