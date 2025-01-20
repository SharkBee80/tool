const port = 4096;

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const txt2m3uPage = require('./public/funcjs/txt2m3uPage');
const img2ico = require('./public/funcjs/img2ico')

const app = express();
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir); // 如果没有该目录，创建它
}
const outputDir = path.join(__dirname, 'outputs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir); // 如果没有该目录，创建它
}

// 配置文件上传存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // 时间戳 + 原始扩展名
  }
});
const upload = multer({ storage });

//先定义动态路由
app.get('/txt2m3u', async (req, res) => {
  const txtUrl = req.query.url;
  if (!txtUrl) {
    return res.status(400).send('缺少必要的 url 参数');
  } else {
    txt2m3uPage(res, txtUrl)
  }
});

app.post('/img2ico', upload.single('image'), async (req, res) => {
  img2ico(req, res)
});

//

//再定义静态文件处理
app.use(express.static(path.join(__dirname, 'public')));// 设置静态文件目录

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/index', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});


// 404 页面处理
app.use((req, res, next) => {
  res.status(404).send('<h1 style="display: flex;justify-content: center;">404 Not Found</h1>');
});

app.listen(port, () => {
  console.log(`静态服务器已启动，访问地址：http://localhost:${port}`);
});
