const port = 4096;

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const bodyParser = require('body-parser');


const txt2m3uPage = require('./public/nodejs/txt2m3uPage');
const img2ico = require('./public/nodejs/img2ico');
const redirect = require('./public/nodejs/redirect');
const comment = require('./public/nodejs/comment');
const comment_admin = require('./public/nodejs/comment_admin');
const link = require('./public/nodejs/link');
const note = require('./public/nodejs/note');
const N404 = require('./public/nodejs/N404');


const app = express();

// 解析请求体
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 配置文件上传存储 [ico]
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

// 中间件：拦截所有请求，插入 <script> 标签
// 中间件：拦截对 HTML 文件的请求，插入 <script> 标签
const ignoredFiles = ['clock.html', 'FM.html']

app.use((req, res, next) => {
  let host = req.get('Host');
  host = 'http://' + host;
  // 你的JavaScript脚本地址
  const drag = `<script src="${host}/decoratejs/drag.js"></script>`;
  const foot = `<script src="${host}/decoratejs/foot.js"></script>`;

  const spt = drag + foot + '</body>';

  if (req.path.endsWith('.html')) {
    if (ignoredFiles.some(file => req.path.endsWith(file))) {
      return next();
    };
    const filePath = path.join(__dirname, 'public', req.path);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return next(); // 如果读取文件出错，继续处理下一个中间件
      }
      // 在 <body> 标签前插入 <script> 标签
      const modifiedData = data.replace(
        /<\/body>/i,
        spt
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
          spt
        );
      }
      originalSend.call(res, body);
    };
    next();
  }
});

//

//评论
// 获取评论列表
app.get("/comments", (req, res) => {
  comment(req, res, 'get')
});

// 添加新评论
app.post("/comments", (req, res) => {
  comment(req, res, 'post')
});

// 删除评论
app.delete("/comments/:id", (req, res) => {
  comment(req, res, 'delete');
});

// 进入管理员页面
app.get(['/comment_admin/:token', '/comment_admin'], (req, res) => {
  comment_admin(req, res);
});

//

//短链
// 获取短链列表
app.get("/links", (req, res) => {
  link(req, res, 'get')
});

// 添加新短链
app.post("/links", (req, res) => {
  link(req, res, 'post')
});

// 删除短链
app.delete("/links/:id", (req, res) => {
  link(req, res, 'delete');
});

// 跳转
app.get(['/link', "/link/:shortUrl"], (req, res) => {
  link(req, res, 'red')
});

//

//先定义动态路由
app.get('/txt2m3u', async (req, res) => {
  txt2m3uPage(req, res)
});

app.get('/redirect', (req, res) => {
  const host = req.get('Host'); // 获取主机名和端口号
  const targetUrl = req.query.url;  // 从URL查询参数中获取用户输入的URL
  if (!targetUrl) {
    //return res.status(400).send("缺少跳转URL");
    redirect(host + '/redirect?url=', res, 60, 'here')
    return
  }
  // 返回包含倒计时的HTML页面
  redirect(targetUrl, res)
});

// 记事本
// 获取所有文件列表
app.get('/files', (req, res) => {
  note(req, res, 'list');
});

// 获取指定文件内容
app.get('/file/:filename', (req, res) => {
  note(req, res, 'get')
});

// 保存文件
app.post('/file/:filename', (req, res) => {
  note(req, res, 'post')
});

// 删除文件
app.delete('/file/:filename', (req, res) => {
  note(req, res, 'delete')
});

//

app.post('/gitpull', (req, res) => {
  // 执行系统命令-在服务器运行~/tool-重新拉取github
  const command = "~/tool"
  try {
    //("即将运行"+command+"命令")
    exec(command, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: `执行错误: ${error.message}` });
      }
      if (stderr) {
        return res.status(500).json({ error: `命令错误: ${stderr}` });
      }
      // 返回命令输出
      res.send(stdout);
    });
  } catch (error) {
    res.send(error.message)
  }
});

app.post('/img2ico', upload.single('image'), async (req, res) => {
  img2ico(req, res)
});

//

app.use(express.static(path.join(__dirname, 'public')));// 设置静态文件目录

//再定义静态文件处理
app.get(['/', '/index', '/index.html', '/home'], (req, res) => {
  res.redirect('/home.html');
});


// 404 页面处理
app.use((req, res, next) => {
  N404(req, res, next);
  //res.status(404).send('<h1 style="display: flex;justify-content: center;">404 Not Found</h1>');
});

app.listen(port, () => {
  console.log(`静态服务器已启动，访问地址：http://localhost:${port}`);
});
