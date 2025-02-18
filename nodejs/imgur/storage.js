const fs = require("fs");
const path = require("path");
const multer = require("multer");

const clear = require("./clear");
let clearIntervalId = null;
const interval = 1000 * 60 * 60 * 24; // 24小时

const CACHE_DIR = path.join(__dirname, '../../cache/imgur'); // @:root/cache/imgur

// 确保缓存目录存在
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true }); // 确保递归创建父目录
}

// 数据库
const database = path.join(CACHE_DIR, "database.json");
if (!fs.existsSync(database)) {
    fs.writeFileSync(database, JSON.stringify([]));
}
const data = fs.readFileSync(database, "utf-8");
if (!data.toString()) {
    fs.writeFileSync(database, JSON.stringify([]));
}

// 设置存储引擎
const store = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'cache/imgur/uploads'); // 文件存储目录 @:root/cache/imgur/uploads
    },
    filename: function (req, file, cb) {
        //cb(null, Date.now() + '_' + file.originalname); // 文件名
        //cb(null, Date.now() + path.extname(file.originalname)); // 文件名
        cb(null, Date.now() + '_' + Math.random().toString(36).substring(2, 8) + path.extname(file.originalname)); // 文件名
    }
});

const upload_dir = path.join(__dirname, '../../cache/imgur/uploads');
if (!fs.existsSync(upload_dir)) {
    fs.mkdirSync(upload_dir, { recursive: true }); // 确保递归创建父目录
}

// 初始化上传中间件
const upload = multer({ storage: store });


// 获取所有消息
function getUserMessage(username) {
    let data = fs.readFileSync(database, "utf-8");
    data = JSON.parse(data);
    const userEntry = data.find(entry => entry[username]);
    if (userEntry) {
        return userEntry;
    } else {
        return { [username]: [] };
    }
}

// 保存图片函数
async function saveImage(username, files) {
    if (clearIntervalId) {
        clearInterval(clearIntervalId);
        clearIntervalId = null;
    }
    // 读取 JSON 数据
    let data = fs.readFileSync(database, "utf-8");
    data = JSON.parse(data);

    // 获取所有现有的ID
    let existingIds = new Set(data.flatMap(item => Object.values(item).flatMap(arr => arr.map(obj => obj.id.toLowerCase()))));

    // 找到对应的 username 对象
    let userEntry = data.find(entry => entry[username]);

    // 规范json
    const image = await files.map(file => {
        // 生成新的路径
        const oldPath = path.join(upload_dir, file.filename); // @:root/cache/imgur/uploads/:filename
        const newName = Date.now() + path.extname(file.originalname); // 新文件名
        const newPath = path.join(CACHE_DIR, newName);  // @:root/cache/imgur/:filename
        // 移动文件到 imgur 目录
        const path_ = '/imgur/' + newName;  // @:root/cache/imgur/:filename
        // 移动文件到 imgur 目录
        if (!fs.existsSync(newPath) && fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
        } else {
            return null;
        }

        // 返回更新后的文件信息
        file = {
            id: generateId(existingIds),  // 新文件 ID
            filename: newName,  // 新文件名
            uploadname: file.filename, // 上传文件名
            originalname: file.originalname, // 原始文件名
            uploadTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }), // 上传日期
            size: file.size, // 文件大小
            mimetype: file.mimetype, // 文件类型
            path: path_  // 更新文件的存储路径
        };

        if (!userEntry) {
            data.push({ [username]: [file] });
            userEntry = data.find(entry => entry[username]);
        } else {
            userEntry[username].push(file);
        }
        if (!clearIntervalId) clear.startInterval(clearIntervalId, interval);
        return file;
    });

    // 写入文件
    fs.writeFileSync(database, JSON.stringify(data, null, 4));
    return image;
}

function getImage(filename) {
    let filePath;
    if (!filename.extname) {
        filename = getImageById(filename);
    }
    filePath = path.join(CACHE_DIR, filename);

    return filePath;
}

function getImageById(id) {
    let data = fs.readFileSync(database, "utf-8");
    data = JSON.parse(data);
    // 遍历整个数据结构
    for (const item of data) {
        for (const key in item) {
            const images = item[key];
            for (const image of images) {
                // 如果找到匹配的 id（忽略大小写）
                if (image.id === id) {
                    return image.filename; // 返回对应的 path
                }
            }
        }
    }
    return null; // 如果没有找到匹配的 id，返回 null
}

// 生成一个包含字母和数字的六位随机ID => 36^6 = 2,176,782,336, 62^6 = 56,800,235,584
function generateId(existingIds) {
    let randomId;
    do {
        randomId = generateRandomId(length = 6);
    } while (existingIds.has(randomId.toLowerCase()));
    existingIds.add(randomId);
    return randomId;
}

// 生成一个六位的随机ID
function generateRandomId(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// 删除图片
function deleteImage(username, id) {
    let data = fs.readFileSync(database, "utf-8");
    data = JSON.parse(data);

    // 找到对应的 username 对象
    const userEntry = data.find(entry => entry[username]);
    if (userEntry) {
        // 找到要删除的图片
        const imageIndex = userEntry[username].findIndex(image => image.id === id);
        if (imageIndex !== -1) {
            // 删除图片
            const image = userEntry[username].splice(imageIndex, 1)[0];
            // 删除图片文件
            fs.unlinkSync(path.join(CACHE_DIR, image.filename));
            // 保存更改后的数据
            fs.writeFileSync(database, JSON.stringify(data, null, 2));
            return { success: true, message: '图片删除成功' };
        }
    }
    return { error: '图片删除失败' };
}

clear.startInterval(clearIntervalId, interval);

module.exports = {
    getUserMessage,
    getImage,
    saveImage,
    deleteImage,
    upload,
}