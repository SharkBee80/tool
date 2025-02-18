const express = require('express');
const router = express.Router();
const auth = require('../auth');
const storage = require('./storage');
const path = require('path');

/*
const imgur = require('imgur');
const = express = require('express');
const app = express();
app.use('/imgur', imgur.router);
*/
module.exports = { router };

// 获取消息 API
router.get('/api', auth.authenticateH, (req, res) => {  // 需要验证 JWT
    const messages = storage.getUserMessage(req.user.username);
    res.json(messages);
});

// 获取图片 API
router.get('/:filename', (req, res) => {
    const filename = req.params.filename;
    /*
    if (filename.endsWith('.js') || filename.endsWith('.css')) {
        const file = path.join(__dirname, '../../public/imgur', filename); //@:root/public/imgur
        res.sendFile(file);
        return;
    }
    */
    const imagePath = storage.getImage(filename);
    res.sendFile(imagePath);
})

// 发送图片 API
router.post('/api', auth.authenticateH, storage.upload.array('files', 10), async (req, res) => {  // 需要验证 JWT
    // 'files' 是前端表单中文件输入字段的 name 属性
    // 10 是允许上传的最大文件数量
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        let images = await storage.saveImage(req.user.username, req.files);
        images = images.map(image => ({
            id: image.id, // 文件ID
            filename: image.filename, // 临时文件名
            originalname: image.originalname, // 原始文件名
            size: image.size, // 文件大小
            mimetype: image.mimetype, // 文件类型
            path: image.path, // 文件路径
        }))

        res.status(200).json({ message: 'Files uploaded successfully!', images, success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error uploading files.' });
    }
});

// 删除图片 API
router.delete('/api/:id', auth.authenticateH, (req, res) => {  // 需要验证 JWT
    const id = req.params.id;
    const result = storage.deleteImage(req.user.username, id);
    res.status(200).json(result);
})