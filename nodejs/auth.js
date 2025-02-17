const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');
const path = require('path');
const fs = require('fs');

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
        throw new Error('用户已存在');
    }

    const hashedPassword = bcrypt.hashSync(password, 8);  // 对密码进行加密
    users.push({ username, password: hashedPassword });
    saveUsers();
    return { message: '用户注册成功' };
}

// 登录函数：检查密码，并生成 JWT
function login(username, password) {
    const user = users.find(u => u.username === username);
    if (!user) {
        throw new Error('用户不存在');
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        throw new Error('密码错误');
    }

    // 生成 JWT
    const token = jwt.sign({ username: user.username }, config.secretKey, { expiresIn: '1h' });
    return { token };
}

// 中间件：验证 JWT
/**
 * Headers: { 'x-api-key': 'your_token' }
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function authenticateH(req, res, next) {
    const token = req.headers['x-api-key'];
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
};
