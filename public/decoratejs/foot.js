(function () {
    // 动态创建和应用CSS样式
    const style = document.createElement('style');
    style.innerHTML = `
        body {
            display: flex;
            flex-direction: column;
        }

        .content {
            flex: 1; /* 使内容区占满剩余空间 */
        }

        .footxx {
            text-align: center;
            /*margin: 20px;*/
            padding-bottom: 10px;
            /*background-color: white;
            box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1); /* 底部阴影 */
        }

        .footxx a {
            margin: 0 15px;
            text-decoration: none;
            color: #666666;
            font-size: 12px;
        }

        /*.footxx a:hover {
            text-decoration: underline;
        }/*
    `;
    // 将样式插入到页面的head中
    document.head.appendChild(style);

    // 创建页面内容和底部内容
    const foot = document.createElement('div');
    foot.className = 'footxx'
    foot.innerHTML = `
        <div>
            <a target="_blank" href="https://tool.fyk.us.kg/">主页</a>
            <a target="_blank" href="https://github.com/SharkBee80/tool">GitHub</a>
            <br>
            <a>© SharkBee80.</a>
            <a>powered by serv00</a>
        </div>
    `;
    

    // 将内容和底部元素插入到页面
    document.body.appendChild(foot);
})();
