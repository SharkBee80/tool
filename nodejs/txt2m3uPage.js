function convertToM3U(res, txtInput) {
    const lines = txtInput.split('\n');
    let m3uOutput = '#EXTM3U x-tvg-url="https://live.fanmingming.cn/e.xml"\n';
    let currentGroup = null;
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine !== '') {
            if (trimmedLine.includes('#genre#')) {
                currentGroup = trimmedLine.replace(/,#genre#/, '').trim();
            } else {
                const [originalChannelName, channelLink] = trimmedLine.split(',').map(item => item.trim());
                const processedChannelName = originalChannelName.replace(/(CCTV|CETV)-(\d+).*/, '$1$2');
                m3uOutput += `#EXTINF:-1 tvg-name="${processedChannelName}" tvg-logo="https://live.fanmingming.cn/tv/${processedChannelName}.png"`;
                if (currentGroup) {
                    m3uOutput += ` group-title="${currentGroup}"`;
                }
                m3uOutput += `,${originalChannelName}\n${channelLink}\n`;
            }
        }
    }
    // 设置响应头并返回 M3U 数据
    res.setHeader('Content-Disposition', 'inline; filename=txt2m3u.m3u');// 防止文件下载
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    //res.setHeader('Content-Type', 'text/plain');
    res.send(m3uOutput)
}

async function fetchTextFile(res, url) {
    // 检查 URL 是否以 http:// 或 https:// 开头，如果没有，则自动添加 http://
    if (!/^https?:\/\//i.test(url)) {
        url = 'http://' + url;  // 默认添加 http://
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`请求失败，状态码：${response.status}`);
        }

        const contentType = response.headers.get('Content-Type'); // 判断是否text
        if (contentType && contentType.includes('text/plain')) { } else {
            throw new Error('Web is not a text');
        }

        const txtInput = await response.text();

        if (typeof txtInput !== 'string') {
            throw new Error('Response is not a string');
        }
        // 在这里处理 txtInput，例如调用 convertToM3U(txtInput)
        convertToM3U(res, txtInput)
    } catch (error) {
        console.error('获取文件时出错：', error);
        res.send('获取文件时出错：' + error)
    }
}

function txt2m3uPage(req, res) {
    const txtUrl = req.query.url;
    if (!txtUrl) {
        return res.status(400).send(`缺少必要的 url 参数\nhttps://example.txt`);
    } else {
        fetchTextFile(res, txtUrl)
    }
}

module.exports = txt2m3uPage;