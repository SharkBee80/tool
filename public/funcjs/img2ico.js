const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const input = '../..'
const output = '../../outputs'

function emptyDir(path) {
    const files = fs.readdirSync(path);
    files.forEach(file => {
        const filePath = `${path}/${file}`;
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            emptyDir(filePath);
        } else {
            fs.unlinkSync(filePath);
            // console.log(`删除${file}文件成功`);
        }
    });
}

async function img2ico(req, res) {
    try {
        if (!req.file) {
            return res.status(400).send('未上传文件');
        }
        const inputFilePath = path.join(__dirname, input, req.file.path);
        const outputFilePath = path.join(__dirname, output, 'output.ico');
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
            fs.unlinkSync(inputFilePath);
            fs.unlinkSync(outputFilePath);
        });
    } catch (error) {
        emptyDir('uploads')
        emptyDir('outputs')
        console.log('转换失败: ' + error)
        res.status(500).send('转换失败: ' + error.message);
    }
}

module.exports = img2ico;