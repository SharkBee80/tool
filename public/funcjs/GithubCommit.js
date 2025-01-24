const axios = require('axios');
const { createCanvas } = require('canvas');

// 自动换行
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split('\n');
    let line = '';
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testWidth = context.measureText(testLine).width;
        if (testWidth > maxWidth && i > 0) {
            context.fillText(line, x, y);
            line = words[i] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

async function GithubCommit(req, res) {
    const owner = req.query.owner; // 仓库所有者
    const repo = req.query.repo; // 仓库名称
    let text = "result";
    if (!owner || !repo) {
        text = "缺少必要的 url 参数\nowner或repo"
    } else {
        try {
            const url = `https://api.github.com/repos/${owner}/${repo}/commits`;
            const response = await axios.get(url);
            const commits = response.data;

            if (commits.length > 0) {
                const latestCommit = commits[0];
                const commitName = latestCommit.commit.committer.name;
                const commitDate = latestCommit.commit.committer.date;
                text = `更新人员: ${commitName}\n更新日期: ${commitDate}`
            } else {
                text = `未找到更新信息。`
            }
        } catch (error) {
            text = `Error fetching data: \n${error}`
        }
    }

    // 创建画布和上下文
    const width = 400;
    const height = 100;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 设置背景颜色
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, width, height);

    // 设置文本样式
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 24px SimHei';

    // 设置对齐方式
    ctx.textAlign = 'left'; // 左对齐
    ctx.textBaseline = 'middle'; // 垂直居中

    // 绘制文本
    wrapText(ctx, text, 0, height / 3, width , 40);


    // 返回图片
    const buffer = canvas.toBuffer('image/png');
    res.set('Content-Type', 'image/png');
    res.send(buffer);
}



module.exports = GithubCommit;
