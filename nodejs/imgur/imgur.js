const express = require('express');
const router = express.Router();
const auth = require('../auth');
const storage = require('./storage');
const fs = require('fs');
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

    const result = filter(messages);

    res.json(result);
});

// 获取图片 API
router.get('/:filename', (req, res) => {
    const filename = req.params.filename;
    const imgur_html = path.join(__dirname, '../../public/imgur');
    if (!filename) return res.sendFile(path.join(imgur_html, 'index.html'));
    if (fs.existsSync(path.join(imgur_html, filename))) {
        return res.sendFile(path.join(imgur_html, filename));
    }
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
        images = filter(images);

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

// 筛选
function filter(messages) {
    const result = {};
    // 遍历对象的键
    for (const key in messages) {
        if (messages.hasOwnProperty(key)) {
            // 提取每个键对应的数组中的 id、filename 和 path
            result[key] = messages[key].map(item => ({
                id: item.id,
                //filename: item.filename,
                originalname: item.originalname,
                uploadTime: item.uploadTime,
                //size: item.size,
                //mimetype: item.mimetype,
                path: item.path
            }));
        }
    }
    return result;
}