//const fyk-auth-token = localStorage.getItem("fyk-auth-token");  // 获取存储的身份验证 Token

// 登录
function login() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    const _7days = document.getElementById("_7days").checked;

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
        body: JSON.stringify({ username, password, _7days })
    })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("fyk-auth-token", data.token);  // 保存 Token
                noty("登录成功");
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
    localStorage.removeItem("fyk-auth-token");  // 移除 Token
    window.location.href = "login.html";  // 跳转到登录页面
}

function unregister() {
    const username = document.getElementById("unregisterUsername").value;
    const password = document.getElementById("unregisterPassword").value;

    if (!username || !password) {
        noty((username ? '' : '用户名') + ((username + password) ? '' : '和') + (password ? '' : '密码') + '不能为空');
        return;
    }

    fetch("/auth/unregister", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === "SUCCESS") {
                noty("注销成功");
            } else if (data.error === "WRONG")
                noty("密码错误");
            else if (data.error === "NOTEXIST")
                noty("用户不存在");
            else
                noty("注销失败");
        })
}