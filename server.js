const port = 4096;

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');


const txt2m3uPage = require('./public/funcjs/txt2m3uPage');
const GithubCommit = require('./public/funcjs/GithubCommit')
const img2ico = require('./public/funcjs/img2ico')
const redirect = require('./public/funcjs/redirect')

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

//

// 你的JavaScript脚本地址
const scriptUrl = 'decoratejs/drag.js';

// 中间件：拦截所有请求，插入 <script> 标签
// 中间件：拦截对 HTML 文件的请求，插入 <script> 标签
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const filePath = path.join(__dirname, 'public', req.path);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return next(); // 如果读取文件出错，继续处理下一个中间件
      }
      // 在 <head> 标签前插入 <script> 标签
      const modifiedData = data.replace(
        /<\/head>/i,
        `<script src="${scriptUrl}"></script></head>`
      );
      res.send(modifiedData);
    });
  } else {
    const originalSend = res.send;
    res.send = function (body) {
      if (typeof body === 'string') {
        // 在 </body> 标签前插入 <script> 标签
        body = body.replace(
          /<\/body>/i,
          `<script src="${scriptUrl}"></script></body>`
        );
      }
      originalSend.call(res, body);
    };
    next();
  }
});

//

//先定义动态路由
app.get('/txt2m3u', async (req, res) => {
  const txtUrl = req.query.url;
  if (!txtUrl) {
    return res.status(400).send('缺少必要的 url 参数');
  } else {
    txt2m3uPage(res, txtUrl)
  }
});

app.get('/redirect', (req, res) => {
  const host = req.get('Host'); // 获取主机名和端口号
  const targetUrl = req.query.url;  // 从URL查询参数中获取用户输入的URL
  if (!targetUrl) {
    //return res.status(400).send("缺少跳转URL");
    redirect(host + '/redirect?url=', res, 'here')
    return
  }
  // 返回包含倒计时的HTML页面
  redirect(targetUrl, res)
});

//

app.post('/gitpull', (req, res) => {
  // 执行系统命令-在服务器运行~/tool-重新拉取github
  const command = "~/tool"
  //("即将运行"+command+"命令")
  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: `执行错误: ${error.message}` });
    }
    if (stderr) {
      return res.status(500).json({ error: `命令错误: ${stderr}` });
    }
    // 返回命令输出
    res.json({ output: stdout });
  });
});

app.post('/img2ico', upload.single('image'), async (req, res) => {
  img2ico(req, res)
});

//

//再定义静态文件处理
app.use(express.static(path.join(__dirname, 'public')));// 设置静态文件目录

app.get('/', (req, res) => {
  res.redirect('/home.html');
});

// 示例路由：动态生成的页面
app.get('/o', (req, res) => {
  const dynamicContent = '<h1>动态生成的页面</h1>';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>动态页面</title>
      </head>
      <body>
        ${dynamicContent}
        </body>
    </html>
  `;
  res.send(html);
});

// 404 页面处理
app.use((req, res, next) => {
  res.status(404).send('<h1 style="display: flex;justify-content: center;">404 Not Found</h1>');
});

app.listen(port, () => {
  console.log(`静态服务器已启动，访问地址：http://localhost:${port}`);
});
