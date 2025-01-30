const fs = require('fs')
const path = require('path')

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

module.exports = admin;