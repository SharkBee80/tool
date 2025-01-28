const fs = require("fs");
const path = require("path");

// 文件存储路径
const commentsFile = path.join(__dirname, "comments.json");

// 读取文件中的评论
function loadComments() {
    if (fs.existsSync(commentsFile)) {
        const data = fs.readFileSync(commentsFile, "utf-8");
        return JSON.parse(data);
    }
    return [];
}

// 写入评论到文件
function saveComments(comments) {
    fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2));
}

// 初始化评论列表
let comments = loadComments();

function get(res) {
    comments.sort((a, b) => new Date(b.time) - new Date(a.time)); // 倒序排列
    res.json(comments);
}

function post(req,res) {
    const { comment,name } = req.body;

    // 检查评论长度
    if (!comment || comment.length > 200) {
        return res.status(400).send("评论内容不能为空且不能超过200个字符");
    }

    const newComment = {
        text: comment,
        time: new Date().toISOString(),
        name: name || "匿名",  // 默认匿名
    };

    comments.push(newComment);
    saveComments(comments);
    res.status(201).send("评论已添加");
}

function comment(req, res, a) {
    if (a === undefined) return;
    if (a === 'get') get(res);
    if (a === 'post') post(req,res);
}


module.exports = comment;
