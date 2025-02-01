/**
 * 
 * @param {URL} targetUrl 重定向目标地址
 * @param {Response} res Response
 * @param {Int} countdown 倒计时
 * @param {URL} target 页面显示目标地址
 */
function redirect(targetUrl, res, countdown, target) {
    if (target === undefined) {
        target = targetUrl;
    }
    if (countdown === undefined) {
        countdown = 5;
    }

    // 检查 URL 是否以 http:// 或 https:// 开头，如果没有，则自动添加 http://
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'http://' + targetUrl;  // 默认添加 http://
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="zh-CN">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>页面跳转</title>
            <script type="text/javascript">
                var countdown = ${countdown};  // 倒计时的时间（单位：秒）
                var targetUrl = "${targetUrl}";  // 动态获取目标URL

                function updateCountdown() {
                    document.getElementById("countdown").innerText = countdown;
                    if (countdown === 0) {
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
            <div style=" text-align: center;display: block;padding: 5px;margin: 50px auto 10px;max-width: 36%;width: 36%;position: relative;left: 0;right: 0;background-color: beige;border-radius: 15px;">
                <h2>页面即将跳转...</h2>
                <p>如果没有自动跳转，<a href="${targetUrl}">点击这里</a>。</p>
                <p>您将会在 <span id="countdown">5</span> 秒后被转到 <a style="color: red;">${target}</a>。</p>
            </div>
        </body>

        </html>
    `);
}
module.exports = redirect