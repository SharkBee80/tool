const express = require('express');
const path = require('path');

const txt2m3uPage = require('./public/funcjs/txt2m3uPage');

const app = express();
const port = 4096;

//先定义动态路由
app.get('/txt2m3u.html', async (req, res) => {
  const txtUrl = req.query.url;
  if (!txtUrl) {
    res.sendFile(__dirname + '/public/txt2m3u.html');
    //return res.status(400).send('缺少必要的 url 参数');
  } else {
    txt2m3uPage(res, txtUrl)
  }

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
