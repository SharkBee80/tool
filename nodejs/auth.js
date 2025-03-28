const bcrypt = require('bcrypt');
//const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//const config = require('./config');
const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();

const token = require('./token');

const config = {
    secretKey: 'Sharkbee',  // 用于身份验证
    invitationCode: '666',  // 邀请码
};

/*
const app = express();
const auth = require('./auth');
// 账号
app.use('/auth', auth);
*/

router.get('/', (req, res) => {
    const path = req.originalUrl;  // 获取请求路径
    res.redirect(path + '/login.html')
});

// 注册
router.post('/register', (req, res) => {
    const { username, password, invitationCode } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: (username ? '' : '用户名') + ((username + password) ? '' : '和') + (password ? '' : '密码') + '不能为空' });
    }
    if (username.length > 10) {
        return res.status(400).json({ error: '用户名长度不能超过10个字符' });
    }
    if (password.length > 20) {
        return res.status(400).json({ error: '密码长度不能超过20个字符' });
    }
    // 邀请码
    if (invitationCode && invitationCode !== config.invitationCode) {
        return res.status(400).json({ error: '邀请码错误' });
    }
    try {
        const result = register(username, password);  // 调用注册函数
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
})

// 登录
router.post('/login', (req, res) => {
    const { username, password, _7days } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: (username ? '' : '用户名') + ((username + password) ? '' : '和') + (password ? '' : '密码') + '不能为空' });
    }
    try {
        const result = login(username, password, _7days ? 24 * 7 : 1);  // 调用登录函数
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
})

// 删除用户
router.delete('/unregister', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: (username ? '' : '用户名') + ((username + password) ? '' : '和') + (password ? '' : '密码') + '不能为空' });
    }
    try {
        const user = users.find(u => u.username === username);
        if (!user) {
            throw new Error('NOTEXIST');
        }
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            throw new Error('WRONG');
        }
        users = users.filter(u => u.username !== username);
        saveUsers();
        res.json({ message: 'SUCCESS' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
})

// 修改密码
router.put('/changePassword', (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    if (!username || !oldPassword || !newPassword) {
        return res.status(400).json({ error: (username ? '' : '用户名') + ((username + oldPassword) ? '' : '和') + (oldPassword ? '' : '旧密码') + ((username + oldPassword + newPassword) ? '' : '和') + (newPassword ? '' : '新密码') + '不能为空' });
    }
    try {
        const user = users.find(u => u.username === username);
        if (!user) {
            throw new Error('NOTEXIST');
        }
        const isPasswordValid = bcrypt.compareSync(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new Error('WRONG');
        }
        user.password = bcrypt.hashSync(newPassword, 8);  // 对密码进行加密
        saveUsers();
        res.json({ message: 'SUCCESS' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
})

// 检查时效
router.get('/check', (req, res) => {
    const token = req.headers['fyk-auth-token'];
    if (!token) {
        return res.status(401).json({ error: 'NOAUTH' });
    }
    try {
        const decoded = jwt.verify(token, config.secretKey);
        res.json({ success: 'SUCCESS', user: decoded.username }); // 返回用户名
    } catch (err) {
        res.status(401).json({ error: 'EXPIRED' });
    }
})

// all

router.get(['/all','/all/:key'], (req, res) => {
    const key = req.params.key;
    if (!key) {
        return res.status(401).json({ error: 'NOTVALUE' });
    }
    if (key === token.generateKey()) {
        const user = getUsers();
        res.json(user);
    }
    else {
        res.status(401).json({ error: 'WRONGKEY' });
    }
});

// 模拟的用户数据存储（实际应用中可以使用数据库）
const users_file = path.join(__dirname, 'users.json');
let users = getUsers();  // 初始化用户数据

function getUsers() {
    if (fs.existsSync(users_file)) {
        const data = fs.readFileSync(users_file);
        if (!data.toString()) return [];
        return JSON.parse(data);
    }
    return [];
}

function saveUsers() {
    fs.writeFileSync(users_file, JSON.stringify(users, null, 2));
}

// 注册函数：用 bcrypt 加密密码并存储
function register(username, password) {
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        throw new Error('EXISTING');
    }

    const hashedPassword = bcrypt.hashSync(password, 8);  // 对密码进行加密
    users.push({ username, password: hashedPassword });
    saveUsers();
    return { message: 'SUCCESS' };
}

// 登录函数：检查密码，并生成 JWT
/**
 * 
 * @param {String} username 
 * @param {String} password 
 * @param {Number} timelimit 时效限制，单位为小时，默认为1小时
 */
function login(username, password, timelimit = 1) {
    const user = users.find(u => u.username === username);
    if (!user) {
        throw new Error('NOTEXIST');
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        throw new Error('WRONG');
    }

    // 生成 JWT
    const token = jwt.sign({ username: user.username }, config.secretKey, { expiresIn: `${timelimit}h` });
    return { token };
}

// 中间件：验证 JWT
/**
 * Headers: { 'fyk-auth-token': 'your_token' }
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function authenticateH(req, res, next) {
    const token = req.headers['fyk-auth-token'];
    if (!token) {
        return res.status(403).json({ error: 'without token' });
    }

    try {
        const decoded = jwt.verify(token, config.secretKey);  // 验证 token
        req.user = decoded;  // 将解码后的用户信息添加到请求中
        next();
    } catch (err) {
        return res.status(403).json({ error: 'unvalid token' });
    }
}
/**
 * Query: ?token=your_token
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function authenticateQ(req, res, next) {
    const token = req.query.token;
    if (!token) {
        return res.status(403).json({ error: 'without token' });
    }

    try {
        const decoded = jwt.verify(token, config.secretKey);  // 验证 token
        req.user = decoded;  // 将解码后的用户信息添加到请求中
        next();
    } catch (err) {
        return res.status(403).json({ error: 'unvalid token' });
    }
}

/**
 * Params: /:username/:password
 * @param {String} username 
 * @param {String} password 
 * @returns 
 */
function authenticateP(username, password) {
    const user = users.find(u => u.username === username);
    if (!user) return false;

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return false;

    return true;
}

module.exports = {
    register,
    login,
    authenticateH,
    authenticateQ,
    authenticateP,
    router,
};
