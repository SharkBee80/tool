const fs = require('fs')
const path = require('path')

module.exports = admin;
/*
// 进入管理员页面
app.get(['/comment_admin/:token', '/comment_admin'], (req, res) => {
  comment_admin(req, res);
});
*/
const tokens = ['sb', 'ad'];

const ban = `
    你没有权限到达这里
`

function admin(req, res) {
    const { token } = req.params;
    if (!tokens.some(tk => tk === token)) {
        res.status(502).send(ban);
        return;
    }

    const filePath = path.join(__dirname, 'comment_admin_x.html');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(404);
        }
        res.send(`${data}`);
    });
}
