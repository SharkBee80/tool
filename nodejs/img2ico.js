const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 创建文件夹以存储ico
const uploadDir = path.join(__dirname, '../cache/ico', 'uploads'); // @root/cache/ico/uploads
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // 确保递归创建父目录
}
const outputDir = path.join(__dirname, '../cache/ico', 'outputs'); // @root/cache/ico/outputs
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true }); // 如果没有该目录，创建它
}

// 递归清空目录
async function emptyDir(directory) {
    try {
        const files = await fsPromises.readdir(directory);
        for (const file of files) {
            const filePath = path.join(directory, file);
            const stats = await fsPromises.stat(filePath);
            if (stats.isDirectory()) {
                await emptyDir(filePath); // 递归删除子目录
                await fsPromises.rmdir(filePath); // 删除空目录
            } else {
                await fsPromises.unlink(filePath); // 删除文件
                console.log(`已删除文件: ${file}`);
            }
        }
    } catch (err) {
        console.error(`清空目录失败: ${directory}`, err);
    }
}

async function img2ico(req, res) {
    try {
        if (!req.file) {
            return res.status(400).send('未上传文件');
        }
        const inputFilePath = path.join(__dirname, '..', req.file.path); // @root/cache/ico/uploads/...
        const outputFilePath = path.join(outputDir, 'output.ico'); // @root/cache/ico/outputs/output.ico
        const size = Number(req.body.size)
        //console.log(size)
        //console.log('上传的文件:', inputFilePath);
        // 确保文件存在
        if (!fs.existsSync(inputFilePath)) {
            return res.status(400).send('上传的文件丢失');
        }
        // 使用 sharp 将图像转换为 ICO 格式
        await sharp(inputFilePath)
            .resize(size, size) // 可选：根据需要调整大小
            .toFile(outputFilePath);

        //console.log('文件转换成功:', outputFilePath);

        // 返回转换后的文件
        res.sendFile(outputFilePath, () => {
            // 文件发送后，删除临时上传的文件
            fs.unlinkSync(inputFilePath, (err) => {
                if (err) {
                    console.error('删除临时文件失败:', err);
                    throw new Error('删除临时文件失败');
                }
            });
            fs.unlinkSync(outputFilePath,( err) => {
                if (err) {
                    console.error('删除临时文件失败:', err);
                    throw new Error('删除临时文件失败');
                }
            });
        });
    } catch (error) {
        emptyDir('uploads')
        emptyDir('outputs')
        console.log('转换失败: ' + error)
        res.status(500).send('转换失败: ' + error.message);
    }
}


module.exports = img2ico;