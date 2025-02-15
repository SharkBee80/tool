const port = 4096;

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const bodyParser = require('body-parser');


const txt2m3uPage = require('./nodejs/txt2m3uPage');
const img2ico = require('./nodejs/img2ico');
const redirect = require('./nodejs/redirect').red;
const comment = require('./nodejs/comment');
const comment_admin = require('./nodejs/comment_admin');
const link = require('./nodejs/link');
const note = require('./nodejs/note');
const N404 = require('./nodejs/N404');
const cors = require('./nodejs/cors');

const app = express();

// 解析请求体
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 配置文件上传存储 [ico]
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'cache/ico/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // 时间戳 + 原始扩展名
  }
});
const upload = multer({ storage });

//

// 中间件：拦截所有请求，插入 <script> 标签
// 中间件：拦截对 HTML 文件的请求，插入 <script> 标签
const ignoredFiles = ['clock.html', 'FM']

app.use((req, res, next) => {
  let host = req.get('Host');
  host = 'http://' + host;
  // 你的JavaScript脚本地址
  const drag = `<script src="${host}/decoratejs/drag.js"></script>`;
  const foot = `<script src="${host}/decoratejs/foot.js"></script>`;

  const spt = drag + foot + '</body>';

  // 检查请求路径是否以 .html 结尾或是文件夹路径
  if (req.path.endsWith('.html') || req.path === '/' || req.path.endsWith('/')) {
    // 如果请求的路径在忽略列表中，直接跳过
    if (ignoredFiles.some(file => req.path.includes(file))) {
      return next(); // 跳过该请求，继续执行下一个中间件
    }

    let filePath;

    // 如果请求的是文件夹路径，自动添加 index.html
    if (req.path.endsWith('/')) {
      filePath = path.join(__dirname, 'public', req.path, 'index.html');
    } else {
      filePath = path.join(__dirname, 'public', req.path);
    }

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
      if (typeof body === 'string' && body.includes('</body>')) {
        // 在 </body> 标签前插入 <script> 标签
        body = body.replace(/<\/body>/i, spt);
      }
      originalSend.call(res, body);
    };
    next();
  }
});

//

//先定义动态路由
app.get('/txt2m3u', async (req, res) => {
  txt2m3uPage(req, res)
});

app.get('/redirect', (req, res) => {
  redirect(req, res);
});

//

// 评论
// 路由
app.use('/comments', comment);

// 进入管理员页面
app.get(['/comment_admin/:token', '/comment_admin'], (req, res) => {
  comment_admin(req, res);
});

//

// 短链
// 路由
app.use('/links', link.router)
// 跳转
app.get(['/link', "/link/:shortUrl"], (req, res) => {
  link.red(req, res);
});

//

// 记事本
app.use('/files', note.files)
app.use('/file', note.file);

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

// cors
app.get(['/cors', '/cors/:path', '/cors/:path/:filename'], async (req, res) => {
  cors(req, res);
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
