//const fykAuthToken = localStorage.getItem("fykAuthToken");  // 获取存储的身份验证 Token

// 登录
function login() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) {
        noty((username ? '' : '用户名') + ((username + password) ? '' : '和') + (password ? '' : '密码') + '不能为空')
        //noty("请输入用户名和密码！");
        return;
    }

    fetch("/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("fykAuthToken", data.token);  // 保存 Token
                //window.location.href = "/";  // 跳转到首页
            } else if (data.error === "WRONG") {
                noty("密码错误");
            } else if (data.error === "NOTEXIST") {
                noty("用户不存在");
            } else {
                noty("登录失败");
            }
        })
        .catch(error => console.error("Error:", error));
}

// 注册
function register() {
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;

    if (!username || !password) {
        noty((username ? '' : '用户名') + ((username + password) ? '' : '和') + (password ? '' : '密码') + '不能为空')
        //noty("请输入用户名和密码！");
        return;
    }

    if (username.length > 10) {
        noty("用户名不能超过10个字符！")
        return;
    } 
    if (password.length > 20) {
        noty("密码不能超过20个字符！")
        return;
    }


    fetch("/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === "SUCCESS") {
                noty("注册成功");
                setTimeout(() => {
                    window.location.href = "login.html";  // 注册成功，跳转到登录页面
                }, 1000);
            }
            else if (data.error === "EXISTING") {
                noty("用户已存在");
            }
            else {
                noty("注册失败");
            }
        })
        .catch(error => console.error("Error:", error));
}

// 注销
function logout() {
    localStorage.removeItem("fykAuthToken");  // 移除 Token
    window.location.href = "login.html";  // 跳转到登录页面
}
