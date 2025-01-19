const express = require('express');

const txt2m3uPage = require('./funcjs/txt2m3uPage');

const app = express();
const port = 4096;

// 设置静态文件目录
app.use(express.static('public'));
app.use(express.static('funcjs'));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/index', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
  });

app.get('/txt2m3u', async (req, res) => {
    const txtUrl = req.query.url;
    if (!txtUrl) {
      return res.status(400).send('缺少必要的 url 参数');
    }
    txt2m3uPage(res,txtUrl)
});

app.listen(port, () => {
  console.log(`静态服务器已启动，访问地址：http://localhost:${port}`);
});
