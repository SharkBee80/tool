const axios = require('axios');
const { createCanvas,registerFont  } = require('canvas');

// 注册自定义字体
//registerFont('./public/decoratejs/SimHei.ttf', { family: 'MyCustomFont' });

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
                let commitName = latestCommit.commit.committer.name;
                let commitDate = latestCommit.commit.committer.date;
                const date = new Date(commitDate);
                commitDate = date.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false, // 使用24小时制
                }).replace(/\//g, '-').replace(',', '');
                //text = `更新人员: ${commitName}\n更新日期: ${commitDate} UTC`;
                text = `Commiter: ${commitName}\nUpdate  : ${commitDate} UTC`;
                //console.log(commitName);
                //console.log(commitDate);
            } else {
                text = `未找到更新信息。`;
            }
        } catch (error) {
            text = `Error fetching data: \n${error}`;
            console.log(error);
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
    ctx.font = 'bold 24px SimHei';//SimHei \ MyCustomFont

    // 设置对齐方式
    ctx.textAlign = 'left'; // 左对齐
    ctx.textBaseline = 'middle'; // 垂直居中

    // 绘制文本
    wrapText(ctx, text, 0, height / 3, width, 40);


    // 返回图片
    const buffer = canvas.toBuffer('image/png');
    res.set('Content-Type', 'image/png');
    res.send(buffer);
}



module.exports = GithubCommit;


//<img src="https://tool.fyk.us.kg/latest-commit?owner=sharkbee80&&repo=tool" alt="更新信息image"></img>

/*
app.get('/latest-commit', async (req, res) => {
    GithubCommit(req, res)
  });
  
*/