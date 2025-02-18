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

// 删除不在 JSON 数据中的文件
function cleanUpFiles() {
    const jsonData = readJsonData();
    const validPaths = getValidPaths(jsonData);

    // 读取 /imgur 目录下的文件
    fs.readdir(imgurDirectory, (err, files) => {
        if (err) {
            console.error('Error reading imgur directory:', err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(imgurDirectory, file);

            // 忽略 database.json 文件
            if (file === 'database.json') {
                return;
            }

            // 如果文件不在 JSON 数据中，则删除
            if (!validPaths.has(filePath)) {
                fs.unlink(filePath, err => {
                    if (err) {
                        console.error('Error deleting file:', filePath, err);
                    } else {
                        console.log('Deleted:', filePath);
                    }
                });
            }
        });
    });
}

// 定时任务（每 5 分钟执行一次）
const interval = 5 * 60 * 1000; // 5 分钟
setInterval(cleanUpFiles, interval);

// 初始执行一次
cleanUpFiles();