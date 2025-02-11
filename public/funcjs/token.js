/**
 * 
 * @description change every 100s
 * @returns token
 */
function generateKey() {
    // 获取当前时间戳并截取前9位
    const timestamp = Date.now().toString().substring(0, 8);
    console.log("Timestamp:", timestamp);

    // Base64编码
    const enBase64 = encodeBase64(timestamp);
    console.log("Base64:", enBase64);

    // 每个字符进一位（z→a，9→0，+、/、=不变）
    const modifiedBase64 = enBase64.split('').map(c => {
        if (c >= 'a' && c < 'z') {
            return String.fromCharCode(c.charCodeAt(0) + 1);  // 小写字母
        } else if (c >= 'A' && c < 'Z') {
            return String.fromCharCode(c.charCodeAt(0) + 1);  // 大写字母
        } else if (c >= '0' && c < '9') {
            return String.fromCharCode(c.charCodeAt(0) + 1);  // 数字
        } else if (c === 'z') {
            return 'a';
        } else if (c === 'Z') {
            return 'A';
        } else if (c === '9') {
            return '0';
        } else {
            return c;  // 保留 + / =
        }
    }).join('');
    console.log("Modified Base64:", modifiedBase64);

    // Base64解码
    const deBase64 = decodeBase64(modifiedBase64);
    console.log("deBase64:", deBase64);

    // 将解码结果转换为十六进制
    const hex = Array.from(deBase64).map(c =>
        c.charCodeAt(0).toString(16).padStart(2, '0')
    ).join('');
    console.log("Hexadecimal:", hex);
    return hex;
}

function encodeBase64(str) {// 编码
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        // 浏览器环境
        return btoa(str);
    } else if (typeof Buffer !== 'undefined') {
        // Node.js 环境
        return Buffer.from(str, 'utf8').toString('base64');
    } else {
        throw new Error('Unsupported environment');
    }
}

function decodeBase64(str) {// 解码
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
        // 浏览器环境
        return atob(str);
    } else if (typeof Buffer !== 'undefined') {
        // Node.js 环境
        return Buffer.from(str, 'base64').toString('utf8');
    } else {
        throw new Error('Unsupported environment');
    }
}


// 示例
//const key = generateKey();