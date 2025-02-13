const axios = require('axios');
const UserAgent = require('user-agents');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = cors;
// http://127.0.0.1:3000/cors/666.m3u8?url=https://live.ximalaya.com/radio-first-page-app/live/1427/64.m3u8
/*app.get('/cors/:path', async (req, res) => {
    cors(req, res);
});
*/

const CACHE_DIR = path.join(__dirname, '../..', 'cache');

// 确保缓存目录存在
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR);
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @description 代理请求 [(?mode=&url=)]
 * @returns 
 */
async function cors(req, res) {

    // 设置 CORS 响应头
    const origin = req.get('Origin');
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin); // 动态设置 Origin
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    const path = req.params.path || 'index.xxx';
    // 获取片段文件
    if (path === 'live') {
        return live(req, res);
    }

    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }

    /*
    const ALLOWED_HOSTS = ['example.com', 'api.example.com'];// 允许访问的域名列表
    const hostname = new URL(url).hostname;
    if (!ALLOWED_HOSTS.includes(hostname)) {
        return res.status(403).json({ error: 'Forbidden: This host is not allowed' });
    }
    */

    const mode = req.query.mode || 1;

    switch (Number(mode)) {
        case 0:
            return mode0(req, res);
        case 1:
            return mode1(req, res);
        case 2:
            return mode2(req, res);
    }
}

// 默认代理
async function mode0(req, res) {
    try {
        const url = req.query.url;
        // 发送代理请求
        const response = await axios.get(url, {
            responseType: 'stream', // 以流的方式传输数据
            headers: {
                'User-Agent': getRandomUA('mobile'),
            },
            timeout: 5000, // 设置 5 秒超时
        });

        // 传递目标服务器的 headers，但可过滤一些敏感信息
        res.set({
            'Header': response.headers['header'] || 'application/octet-stream',
            'Content-Type': response.headers['content-type'] || 'application/octet-stream',
            'Cache-Control': 'no-cache',
        });

        // 使用流传输数据，避免占用过多内存
        response.data.pipe(res);
    } catch (error) {
        console.error('Proxy request error:', error.message);

        if (error.response) {
            // 服务器响应了错误状态
            res.status(error.response.status).json({ error: `Remote server error: ${error.response.statusText}` });
        } else if (error.code === 'ECONNABORTED') {
            // 请求超时
            res.status(504).json({ error: 'Request timed out' });
        } else {
            // 其他网络错误
            res.status(500).json({ error: 'Failed to fetch URL' });
        }
    }
}

// m3u8 代理
async function mode1(req, res) {
    try {
        const m3u8Url = req.query.url;
        const response = await axios.get(m3u8Url);
        let m3u8Content = response.data;

        //const m3u8Name = req.params.path || getFileName(m3u8Url);
        //const m3u8Path = path.join(CACHE_DIR, m3u8Name);

        let host = req.get('host');
        if (host.includes('localhost', '127.0.0.1')) {
            host = 'http://' + host;
        } else {
            host = 'https://' + host;
        }

        // 替换 m3u8 中的片段 URL，使其通过服务器代理
        m3u8Content = m3u8Content.replace(/(https?:\/\/.*?\/)(.*?\.(ts|aac|mp4|webm|m4s|m4a))/gi, (match, baseUrl, segmentPath) => {
            const url = baseUrl + segmentPath;
            const fileName = getFileName(url);
            downloadLive(url, fileName);
            return `${host}/cors/live/${fileName}`;
        });

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

        res.send(m3u8Content);

    } catch (error) {
        console.error('获取 m3u8 文件失败:', error);
        res.status(500).send('Error fetching m3u8');
    }
}

// mp3、mp4 代理
async function mode2(req, res) {
    const videoUrl = req.query.url;
    const filename = path.basename(videoUrl).split('?')[0]; // 获取文件名
    const filePath = path.join(CACHE_DIR, filename);

    // 如果文件已缓存，直接返回
    if (fs.existsSync(filePath)) {
        console.log('获取缓存文件:', filePath);
        return res.sendFile(filePath);
    }

    console.log('Downloading:', videoUrl);
    try {
        const response = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream', // 以流的方式下载
        });

        // 设置正确的 Content-Type
        res.setHeader('Content-Type', response.headers['content-type']);

        // 以流的方式保存文件并传输给前端
        const fileStream = fs.createWriteStream(filePath);
        response.data.pipe(fileStream);
        response.data.pipe(res);

        fileStream.on('finish', () => console.log('Download finished:', filePath));
    } catch (error) {
        console.error('Error fetching video:', error);
        res.status(500).send('Error fetching video');
    }
};


async function live(req, res) {
    const fileName = req.params.filename;
    try {
        const filePath = path.join(CACHE_DIR, fileName);
        if (!filePath) {
            console.error('文件不存在:', filePath);
            return res.status(500).send('下载错误');
        }
        res.sendFile(filePath);
    } catch (error) {
        console.error('获取ts文件失败:', error);
        res.status(500).send('Error fetching live');
    }
}

async function downloadLive(url, fileName) {
    // 正则表达式匹配文件扩展名
    const extension = url.split('.').pop().split('?')[0];
    const filename = fileName || crypto.createHash('md5').update(url).digest('hex') + '.' + extension;
    const filePath = path.join(CACHE_DIR, filename);

    // 如果文件已缓存，直接返回
    if (fs.existsSync(filePath)) {
        // console.log('获取缓存文件:', filePath);
        return filePath;
    }

    console.log('开始下载:', url);
    try {
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream',
        });

        // 以流方式保存并传输
        const fileStream = fs.createWriteStream(filePath);
        response.data.pipe(fileStream);

        fileStream.on('finish', () => console.log('下载完成:', filePath));
        return filePath;
    } catch (error) {
        console.error('下载错误:', error);
        return null;
    }
}

// 定期删除 time 前的旧文件
setInterval(() => {
    const now = Date.now();
    fs.readdir(CACHE_DIR, (err, files) => {
        if (err) return console.error('没有找到缓存目录:', err);
        files.forEach(file => {
            const filePath = path.join(CACHE_DIR, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return console.error('没有找到缓存文件:', err);
                if (file.endsWith('.m3u8')) {
                    if (now - stats.mtimeMs > 3600000) { // 1小时
                        fs.unlink(filePath, err => {
                            if (err) console.error('删除文件错误:', err);
                            //else console.log('删除文件:', filePath);
                        })
                    }
                }
                else {
                    if (now - stats.mtimeMs > 60000) { // 1分钟
                        fs.unlink(filePath, err => {
                            if (err) console.error('删除文件错误:', err);
                            //else console.log('删除文件:', filePath);
                        });
                    }
                }
            });
        });
    });
}, 60000); // 每分钟检查一次


// 随机UA desktop、mobile、tablet
function getRandomUA(deviceType = 'desktop') {
    // 定义设备类型参数
    const options = {
        deviceCategory: deviceType
    };
    // 返回随机UserAgent
    return new UserAgent(options).toString();
}

// 函数getFileName用于获取url中的文件名
function getFileName(url) {
    // 将url按照'/'分割，并过滤掉空字符串
    const nonEmptyParts = url.split('/').filter(part => part !== '');
    // 如果分割后的数组为空，则返回空字符串
    if (nonEmptyParts.length === 0) return '';
    // 获取分割后的数组的最后一个元素
    const lastPart = nonEmptyParts[nonEmptyParts.length - 1];
    // 将最后一个元素按照'?'或'#'分割，并返回第一个元素
    return lastPart.split(/[?#]/)[0];
}