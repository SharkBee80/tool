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

const CACHE_DIR = path.join(__dirname, '../cache/cors'); // @:root/cache/cors

// 确保缓存目录存在
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true }); // 确保递归创建父目录
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
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        return res.sendStatus(200);
    }

    let path = req.params.path;
    const url = req.query.url;

    // 获取片段文件
    if (path === 'live') return live(req, res);
    else if (!path && !url) return res.status(400).json({ "info": "Home", "cors": "?mode=&url=", "mode": { "mode0": "default", "mode1": "m3u8+ts", "mode2": "only m3u8 file", "mode3": "long stream" }, "url": { "example": "https://example.com/index.m3u8", "?maybe": "https://example.com/index.mp4" }, "live": { "return": "live/example.ts", "describe": "working with mode'1" }, "end": "https://your-domains/cors/xxx.m3u8?mode=&url=https://example.com/index.m3u8" });

    else if (!url) return res.status(400).json({ error: 'Missing URL parameter' });

    /*
    const ALLOWED_HOSTS = ['example.com', 'api.example.com'];// 允许访问的域名列表
    const hostname = new URL(url).hostname;
    if (!ALLOWED_HOSTS.includes(hostname)) {
        return res.status(403).json({ error: 'Forbidden: This host is not allowed' });
    }
    */

    let mode = req.query.mode;
    if (!mode) {
        if (url.includes('m3u8')) {
            mode = '2';
        } else {
            mode = '0';
        }
    }

    switch (mode) {
        case '0':
            return mode0(req, res);
        case '1':
            return mode1(req, res);
        case '2' || 'm3u8':
            return mode2(req, res);
        case '3':
            return mode3(req, res);
        default:
            return mode0(req, res);
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
            //'Cache-Control': 'no-cache',
        });

        // 使用流传输数据，避免占用过多内存
        response.data.pipe(res);
    } catch (error) {
        console.error('代理请求失败:', error.message);

        if (error.response) {
            // 服务器响应了错误状态
            res.status(error.response.status).json({ error: `Remote server error: ${error.response.statusText}` });
        } else if (error.code === 'ECONNABORTED') {
            // 请求超时
            res.status(504).json({ error: 'Request timed out' });
        } else {
            // 其他网络错误
            res.status(500).json({
                error: 'Failed to fetch URL',
                details: error.message
            });
        }
    }
}

// m3u8 代理 Download
async function mode1(req, res) {
    try {
        const m3u8Url = req.query.url;
        const response = await axios.get(m3u8Url, {
            //responseType: 'stream', // 以流的方式传输数据
            headers: {
                'User-Agent': getRandomUA('mobile'),
            },
            timeout: 5000, // 设置 5 秒超时
        });
        let m3u8Content = response.data;

        // 设置或修改文件头信息
        // m3u8Content = setOrModifyFileHeader(m3u8Content);

        let host = req.get('host');
        host = (host.includes('localhost') || host.includes('127.0.0.1')) ? `http://${host}` : `https://${host}`;


        // 获取所有需要下载的片段
        const segments = collectSegments(m3u8Content, m3u8Url);

        // 替换掉所有 URL 为占位符
        m3u8Content = replaceWithPlaceholders(m3u8Content, segments, host);

        // 等待所有片段下载完成
        await Promise.all(segments.map(async (segment) => {
            const filePath = await downloadLive(segment.url, segment.fileName);
            segment.filePath = filePath;  // 下载完成后存储文件路径
        }));

        // 替换占位符为实际的代理 URL
        m3u8Content = replaceWithActualUrls(m3u8Content, segments, host);

        // 返回修改后的 M3U8 内容
        res.setHeader('Content-Type', 'application/x-mpegURL');
        res.send(m3u8Content);

    } catch (error) {
        console.error('获取 m3u8 文件失败:', error);
        res.status(500).send({ error: 'Error fetching m3u8 file' });
    }
}

// m3u8 代理 only m3u8文件
async function mode2(req, res) {
    try {
        const m3u8Url = req.query.url;
        const response = await axios.get(m3u8Url, {
            headers: {
                'User-Agent': getRandomUA('mobile'),
            },
            timeout: 5000, // 设置 5 秒超时
        });
        let m3u8Content = response.data;
        const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/')) + '/'; // 提取 URL 的路径部分
        m3u8Content = m3u8Content.replace(/(https?:\/\/.*?\/|\/)?(.*?\.(ts|aac|mp4|webm|m4s|m4a))/gi, (match, base, segmentPath) => {
            console.log('base:', base, 'segmentPath:', segmentPath);
            //*
            if (segmentPath.includes('#EXT-X-PREFETCH:')) {
                //segmentPath = segmentPath.replace('#EXT-X-PREFETCH:', '');
                return '';
            }
            //*/
            if (base && base !== '/') {
                return base + segmentPath;
            }
            else if (base && base === '/') {
                return getDomainWithHttp(m3u8Url) + '/' + segmentPath;
            }
            else {
                return baseUrl + segmentPath;
            }
        });
        res.setHeader('Content-Type', 'application/x-mpegURL');
        res.send(m3u8Content);
    } catch (error) {
        console.error('获取 m3u8 文件失败:', error);
        res.status(500).send({ error: 'Error fetching m3u8 file' });
    }
}

// longStream 代理 Download
async function mode3(req, res) {
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
            headers: {
                'User-Agent': getRandomUA('mobile'),
            }
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
        res.status(500).json({ error: 'error fetching file' });
    }
}
// 设置或修改文件头信息
function setOrModifyFileHeader(m3u8Content) {
    // 如果文件头不存在，添加 #EXTM3U
    if (!m3u8Content.startsWith('#EXTM3U')) {
        m3u8Content = '#EXTM3U\n' + m3u8Content;
    }

    // 修改或添加其他头信息
    m3u8Content = modifyOrAddHeader(m3u8Content, '#EXT-X-VERSION', '4', false); // 不强制修改 版本号
    m3u8Content = modifyOrAddHeader(m3u8Content, '#EXT-X-ALLOW-CACHE', 'NO', false); // 不强制修改 允许缓存
    //m3u8Content = modifyOrAddHeader(m3u8Content, '#EXT-X-TARGETDURATION', '7', false); // 不强制修改 目标时长
    m3u8Content = modifyOrAddHeader(m3u8Content, '#EXT-X-MEDIA-SEQUENCE', '1', false); // 不强制修改 媒体序列

    return m3u8Content;
}

// 修改或添加文件头信息
function modifyOrAddHeader(m3u8Content, header, value, force = false) {
    const regex = new RegExp(`^${header}:.*`, 'm'); // 使用正则表达式匹配行头，忽略行尾空白

    if (regex.test(m3u8Content)) {
        if (force) {
            // 如果 force 为 true，则强制替换该头信息
            m3u8Content = m3u8Content.replace(regex, `${header}:${value}`);
        }
    } else {
        // 如果头信息不存在，则添加它
        m3u8Content = insertHeaderAtPosition(m3u8Content, header, value);
    }

    return m3u8Content;
}

// 插入头信息到 #EXTM3U 后和 #EXTINF 前
function insertHeaderAtPosition(m3u8Content, header, value) {
    // 查找 #EXTM3U 的位置
    const extm3uIndex = m3u8Content.indexOf('#EXTM3U') + '#EXTM3U'.length;
    // 查找 #EXTINF 的位置
    const extinfIndex = m3u8Content.indexOf('#EXTINF');

    // 如果找到了 #EXTM3U 和 #EXTINF
    if (extm3uIndex !== -1 && extinfIndex !== -1) {
        // 在 #EXTM3U 后和 #EXTINF 前插入新头信息
        m3u8Content = m3u8Content.slice(0, extm3uIndex) + '\n' + header + ':' + value + m3u8Content.slice(extm3uIndex);
    } else {
        // 如果没有找到 #EXTINF 或 #EXTM3U，默认为添加到文件的开头
        m3u8Content = header + ':' + value + '\n' + m3u8Content;
    }

    return m3u8Content;
}

// 收集 M3U8 文件中的所有视频片段信息
function collectSegments(m3u8Content, m3u8Url) {
    const segments = [];

    m3u8Content.replace(/(https?:\/\/.*?\/|\/)?(.*?\.(ts|aac|mp4|webm|m4s|m4a))/gi, (match, base, segmentPath) => {
        //const url = (base ? base : baseUrl) + segmentPath;
        if (base && base !== '/') {
            url = base + segmentPath;
        }
        else if (base && base === '/') {
            const baseUrl = getDomainWithHttp(m3u8Url) + '/'; // 提取 URL 的路径部分
            url = baseUrl + segmentPath;
        }
        else {
            const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/')) + '/'; // 提取 URL 的路径部分
            url = baseUrl + segmentPath;
        }

        //console.log('url:', url);
        const fileName = getFileName(url);
        segments.push({ url, fileName });
    });
    return segments;
}

// 获取m3u8Url域名，并加上http://前缀
function getDomainWithHttp(m3u8Url) {
    const match = m3u8Url.match(/^(https?:\/\/[^\/]+)/);
    return match ? match[0] : null;
}


// 替换 M3U8 中的 URL 为占位符
function replaceWithPlaceholders(m3u8Content, segments, host) {
    return m3u8Content.replace(/(https?:\/\/.*?\/|\/)?(.*?\.(ts|aac|mp4|webm|m4s|m4a))/gi, (match, baseUrl, segmentPath) => {
        const fileName = getFileName((baseUrl ? baseUrl : '') + segmentPath);
        // 返回一个占位符，稍后会替换为真实的代理 URL
        return `${host}/cors/live/${fileName}`;
    });
}

// 替换占位符为实际的代理 URL
function replaceWithActualUrls(m3u8Content, segments, host) {
    segments.forEach(segment => {
        const placeholder = `${host}/cors/live/${segment.fileName}`;
        if (segment.filePath) {
            // 替换占位符为真实的代理 URL
            m3u8Content = m3u8Content.replace(placeholder, `${host}/cors/live/${segment.fileName}`);
        }
    });
    return m3u8Content;
}

// 用于保存正在下载的任务
const downloadQueue = new Set(); // 使用 Set 来避免重复请求

async function downloadLive(url, fileName) {
    // 正则表达式匹配文件扩展名
    const extension = url.split('.').pop().split('?')[0];
    const filename = fileName || crypto.createHash('md5').update(url).digest('hex') + '.' + extension;
    const filePath = path.join(CACHE_DIR, filename);

    // 如果文件已缓存，直接返回
    const fileExists = await fs.promises.access(filePath).then(() => true).catch(() => false);
    if (fileExists) {
        // console.log('获取缓存文件:', filePath);
        return filePath;
    }

    // 如果文件正在下载中，则不重复下载
    if (downloadQueue.has(url)) {
        console.log('该文件正在下载中，跳过:', url);
        return null;
    }

    // 将该文件加入下载队列，表示正在下载
    downloadQueue.add(url);
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

        return new Promise((resolve, reject) => {
            fileStream.on('finish', () => {
                console.log('下载完成:', filePath);
                downloadQueue.delete(url); // 下载完成后移除
                resolve(filePath);
            });

            fileStream.on('error', (err) => {
                console.error('下载错误:', err);
                downloadQueue.delete(url); // 下载完成后移除
                reject(err); // 返回失败的错误信息
            });
        });
    } catch (error) {
        console.error('下载错误:', error.message);
        downloadQueue.delete(url); // 下载完成后移除
        return null;
    }
}

// 定期删除 time 前的旧文件
setInterval(() => {
    const now = Date.now();
    fs.promises.readdir(CACHE_DIR)
        .then(files => {
            files.forEach(async file => {
                const filePath = path.join(CACHE_DIR, file);
                const stats = await fs.promises.stat(filePath);
                if (file.endsWith('.m3u8')) {
                    if (now - stats.mtimeMs > 3600000) { // 1小时
                        fs.unlink(filePath, err => {
                            if (err) console.error('删除文件错误:', err);
                            //else console.log('删除文件:', filePath);
                        })
                    }
                } else {
                    if (now - stats.mtimeMs > 60000) { // 1分钟
                        fs.unlink(filePath, err => {
                            if (err) console.error('删除文件错误:', err);
                            //else console.log('删除文件:', filePath);
                        });
                    }
                }
            });
        })
        .catch(err => console.error('读取目录错误:', err));
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