const axios = require('axios');

async function GithubCommit(req, res) {
    const username = req.query.user;
    const project = req.query.proj
    const style = "style=background-color:#151b23;color:white;"
    if (!username || !project) {
        return res.status(400).send(`<body ${style}>缺少必要的 url 参数<br>user或proj</body>`);
    } else {
        try {
            const url = `https://api.github.com/repos/${username}/${project}/commits`;
            const response = await axios.get(url);
            const commits = response.data;

            if (commits.length > 0) {
                const latestCommit = commits[0];
                const commitName = latestCommit.commit.committer.name;
                const commitDate = latestCommit.commit.committer.date;
                res.send(`<body ${style}>更新人员: ${commitName}<br>更新日期: ${commitDate}</body>`);
            } else {
                res.send(`<body ${style}>未找到信息。</body>`);
            }
        } catch (error) {
            res.status(500).send(`<body ${style}>Error fetching data: ${error}</body>`);
        }
    }
}

module.exports = GithubCommit;
