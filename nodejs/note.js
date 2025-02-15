// 记事本
const fs = require("fs");
const path = require('path');
const express = require('express');
const file = express.Router();
const files = express.Router();

module.exports = { file, files };

/*
const note = require('./note');
// 记事本
app.use('/files', note.files)
app.use('/file', note.file);

*/

files.get('/', (req, res) => {
    list(req, res);
})
file.get('/:filename', (req, res) => {
    get(req, res);
})
file.post('/:filename', (req, res) => {
    post(req, res);
})
file.delete('/:filename', (req, res) => {
    del(req, res);
})

// 创建文件夹以存储记事本
const notesDir = path.join(__dirname, '../public/note/notes'); // @root/public/note/notes
if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

function note(req, res, a) {
    if (a === undefined) return;
    if (a === 'list') list(req, res);
    if (a === 'get') get(req, res);
    if (a === 'post') post(req, res);
    if (a === 'delete') del(req, res);
}

// 获取所有文件列表
function list(req, res) {
    fs.readdir(notesDir, (err, files) => {
        if (err) return res.status(500).send('无法读取文件夹');
        // 获取文件的修改时间并排序
        const fileDetails = files.map(file => {
            const filePath = path.join(notesDir, file);
            const stats = fs.statSync(filePath);  // 获取文件的stat信息
            return { name: file, mtime: stats.mtime };  // 返回文件名和修改时间
        });

        // 按照修改时间排序（从新到旧）
        fileDetails.sort((a, b) => b.mtime - a.mtime);

        res.json(fileDetails);
    });
}

// 获取指定文件内容
function get(req, res) {
    const filePath = path.join(notesDir, req.params.filename);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('文件读取失败');
        res.send(data);
    });
}

// 保存文件
function post(req, res) {
    const filePath = path.join(notesDir, req.params.filename);
    fs.writeFile(filePath, req.body.content, (err) => {
        if (err) return res.status(500).send('文件保存失败');
        res.send('文件已保存');
    });
}

// 删除文件
function del(req, res) {
    const filePath = path.join(notesDir, req.params.filename);
    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).send('无法删除文件');
        res.send(`文件 ${req.params.filename} 删除成功`);
    });
}
