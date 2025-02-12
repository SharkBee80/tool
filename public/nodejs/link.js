const fs = require("fs");
const path = require("path");
const axios = require('axios');
const cheerio = require('cheerio');
const N404 = require("./N404");
const redirect = require("./redirect").redirect;

module.exports = link;

function link(req, res, a) {
    if (a === undefined) return;
    if (a === 'get') get(res);
    if (a === 'post') post(req, res);
    if (a === 'delete') del(req, res);
    if (a === 'red') red(req, res)
}

// 文件存储路径
const linkFile = path.join(__dirname, "links.json");

// 读取文件中的链接
function loadLinks() {
    if (fs.existsSync(linkFile)) {
        const data = fs.readFileSync(linkFile, "utf-8");
        return JSON.parse(data);
    }
    return [];
}

// 写入链接到文件
function saveLinks(links) {
    fs.writeFileSync(linkFile, JSON.stringify(links, null, 2));
}

// 获取名字
async function getName(url) {
    try {
        // 发送 GET 请求获取网页内容
        const { data } = await axios.get(url);

        // 使用 cheerio 加载 HTML 内容
        const $ = cheerio.load(data);

        // 获取 <title> 标签内容
        const title = $('title').text();
        let name;
        if (title.length > 8) {
            name = title.substring(0, 8) + '...';//slice()
        } else name = title;

        return name;
    } catch (error) {
        console.error('Error fetching the title:', error);
        return 'null';
    }
}

// 生成一个包含字母和数字的六位随机ID => 36^6 = 2,176,782,336
function getshort() {
    let randomId;
    // 获取所有现有的ID
    const existingIds = links.map(link => link.id.toLowerCase());
    do {
        randomId = generateRandomId();
    } while (existingIds.includes(randomId.toLowerCase()));
    return randomId;
}

// 生成一个六位的随机ID
function generateRandomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// 初始化链接列表
let links = loadLinks();

function get(res) {
    links.sort((a, b) => new Date(b.time) - new Date(a.time)); // 倒序排列
    res.json(links);
}

async function post(req, res) {
    const { name, originalUrl, toggle } = req.body;

    // 检查链接
    if (!originalUrl) {
        return res.status(400).send("原始链接不能为空");
    }
    if (!/^https?:\/\//i.test(originalUrl)) {
        originalUrl = 'http://' + originalUrl;  // 默认添加 http://
    }

    if (name && name.length > 10) {
        return res.status(400).send("命名不能超过10个字符");
    }

    const newLink = {
        id: Date.now().toString(),  // 为每个链接生成唯一的 ID
        name: name || await getName(originalUrl),
        originalUrl: originalUrl,
        shortUrl: getshort(),
        time: new Date().toISOString(),
        toggle: toggle,
    };

    links.push(newLink);
    saveLinks(links);
    res.status(201).send("链接已添加");
}

// 删除链接
function del(req, res) {
    const { id } = req.params;
    const oldlinks = links;
    links = links.filter(link => link.id !== id);  // 根据 ID 过滤出要删除的评论

    if (oldlinks.length === links.filter(link => link.id !== id).length) {
        return res.status(404).send("链接未找到");
    }

    saveLinks(links);
    res.status(200).send("评论已删除");
}

// 重定向
function red(req, res) {
    const shortUrl = req.params.shortUrl;
    if (!shortUrl) {
        const filePath = path.join(__dirname, '..', 'link.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.status(404);
            }
            res.send(`${data}`);
        });
        return;
    }
    const links = loadLinks();
    const link = links.find(link => link.shortUrl === shortUrl);

    if (link) { // && link.toggle
        //res.redirect(link.originalUrl);
        redirect(link.originalUrl, res, 1)
    } else {
        //res.status(404).json({ error: 'Link not found or is disabled' });
        N404(undefined, res);
    }
}   