/**
 * 页面重定向函数
 * 
 * @param {URL} targetUrl 重定向目标地址 - 必须
 * @param {Response} res Response - 必须
 * @param {Int} countdown 倒计时/s - 默认5秒
 * @param {URL} target 页面显示目标地址 - 默认 targetUrl
 */
function redirect(targetUrl, res, countdown = 5, target = targetUrl) {
    // 检查 URL 是否以 http:// 或 https:// 开头，如果没有，则自动添加 http://
    if (!/^https?:\/\//i.test(targetUrl)) {
        if (targetUrl.startsWith('/')) {
            targetUrl = 'http://' + req.headers.host + targetUrl;  // 如果是相对路径，拼接主机名
        } else {
            targetUrl = 'http://' + targetUrl;  // 默认添加 http://
        }
    }

    // 返回带有倒计时跳转的 HTML 页面
    res.send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>页面跳转</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color:rgba(0, 0, 0, 0);
                    margin: 0;
                    padding: 0;
                }
                .container {
                    text-align: center;
                    padding: 20px;
                    margin: 50px auto;
                    max-width: 400px;
                    width: 100%;
                    background-color: beige;
                    border-radius: 10px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                }
                h2 {
                    color: #333;
                    font-size: 24px;
                }
                p {
                    color: #666;
                }
                #countdown {
                    font-weight: bold;
                    font-size: 24px;
                    color: #f44336;
                }
            </style>
            <script type="text/javascript">
                var countdown = ${countdown};  // 倒计时的时间（单位：秒）
                var targetUrl = "${targetUrl}";  // 动态获取目标URL

                function updateCountdown() {
                    document.getElementById("countdown").innerText = countdown;
                    if (countdown <= 0) {
                        window.location.href = targetUrl;  // 执行跳转
                    } else {
                        countdown--;
                        setTimeout(updateCountdown, 1000);  // 每秒更新一次倒计时
                    }
                }

                window.onload = updateCountdown;
            </script>
        </head>

        <body>
            <div class="container">
                <h2>页面即将跳转...</h2>
                <p>如果没有自动跳转，<a href="${targetUrl}" rel="noopener noreferrer" target="_blank">点击这里</a>。</p>
                <p>您将会在 <span id="countdown">${countdown}</span> 秒后被转到 <a style="color: red;">${target}</a>。</p>
            </div>
        </body>
        </html>
    `);
}

module.exports = redirect;
