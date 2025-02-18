const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//const config = require('./config');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { time } = require('console');
const router = express.Router();

const config = {
    secretKey: 'Sharkbee',  // 用于身份验证
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

router.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: (username ? '' : '用户名') + ((username + password) ? '' : '和') + (password ? '' : '密码') + '不能为空' });
    }
    if (username.length > 10) {
        return res.status(400).json({ error: '用户名长度不能超过10个字符' });
    }
    if (password.length > 20) {
        return res.status(400).json({ error: '密码长度不能超过20个字符' });
    }
    try {
        const result = register(username, password);  // 调用注册函数
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
})

router.post('/login', (req, res) => {
    const { username, password, timelimit } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: (username ? '' : '用户名') + ((username + password) ? '' : '和') + (password ? '' : '密码') + '不能为空' });
    }
    try {
        let times;
        if (timelimit) times = 24 * 7;  // 7天
        const result = login(username, password, times);  // 调用登录函数
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
})

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
