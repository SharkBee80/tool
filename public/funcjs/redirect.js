function redirect(targetUrl,res) {
    res.send(`
        <!DOCTYPE html>
        <html lang="zh-CN">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>页面跳转</title>
            <script type="text/javascript">
                var countdown = 5;  // 倒计时的时间（单位：秒）
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
            <div style=" text-align: center;display: block;padding: 5px;margin: 50px auto;max-width: 36%;position: absolute;left: 0;right: 0;background-color: beige;border-radius: 15px;">
                <h2>页面即将跳转...</h2>
                <p>如果没有自动跳转，<a href="${targetUrl}">点击这里</a>。</p>
                <p>您将会在 <span id="countdown">5</span> 秒后被转到 <a style="color: red;">${targetUrl}</a>。</p>
            </div>
        </body>

        </html>
    `);
}
module.exports = redirect