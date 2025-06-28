// 动态创建和应用CSS样式
const style = document.createElement('style');
style.innerHTML = `
    /* 通知容器 */
    .notification-container {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 9999;
    }

    /* 通知样式 */
    .notification {
        background-color: rgba(44, 42, 40, 0.95);
        color: white;
        padding: 12px 18px;
        border-radius: 8px;
        /*min-width: 100px;*/
        white-space: nowrap;
        text-align: center;
        position: absolute;
        opacity: 0;
        transform: translateY(-40px); /* 初始状态：上方不可见 */
        transition: transform 0.6s ease-out, opacity 0.6s ease-out;
    }

    /* 通知出现时的动画 */
    .notification.show {
        opacity: 1;
        transform: translateY(0);
    }

    /* 通知消失时的动画（先滑动，再透明） */
    .notification.fade-out {
        transform: translateY(-40px); /* 先向上滑动 */
        opacity: 0; /* 渐隐 */
    }
`;
// 将样式插入到页面的 head 中
document.head.appendChild(style);

// 创建通知容器（仅创建一次）
let container = document.querySelector('.notification-container');
if (!container) {
    container = document.createElement('div');
    container.classList.add('notification-container');
    document.body.appendChild(container);
}

// 存储当前通知的队列
const notifications = [];

function noty(message, color, backgroundColor) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.innerText = message;

    // 应用自定义颜色
    if (color) notification.style.color = color;
    if (backgroundColor) notification.style.backgroundColor = backgroundColor;

    // 插入到通知容器中
    container.appendChild(notification);
    notifications.push(notification);

    // 触发显示动画（从顶部滑下）
    setTimeout(() => {
        notification.classList.add('show');
        updateNotifications();
    }, 100);

    // 5 秒后开始消失动画（向上滑动）
    setTimeout(() => {
        notification.classList.add('fade-out');
        notification.style.transform = ''
        notification.style.opacity = ''
        setTimeout(() => {
            notification.remove();
            notifications.shift(); // 从队列中移除
            updateNotifications();
        }, 600); // **动画结束后再删除**
    }, 3000);
    return `notify`
}

// 更新通知位置
function updateNotifications() {
    notifications.forEach((noty, index) => {
        const maxVisible = 3; // 最多 3 个通知全可见
        const offset = Math.min(index, maxVisible - 1) * 50; // 通知间距
        const opacity = index >= maxVisible ? 0.1 : 1; // 超过3个的通知降低透明度

        noty.style.transform = `translateY(${offset}px)`;
        noty.style.opacity = opacity;
        noty.style.zIndex = `${notifications.length - index}`; // 新的通知在最上层
    });
}

// 随机颜色
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

let testIntervalId;
// 测试：每 1.5 秒弹出一个随机颜色的通知
function notytest(c) {
    if (testIntervalId) clearInterval(testIntervalId); 
    testIntervalId = setInterval(() => {
        const textColor = c ? getRandomColor() : undefined;
        const bgColor = c ? getRandomColor() : undefined;
        noty(`测试通知 ${new Date().toLocaleTimeString()}`, textColor, bgColor);
    }, 1500);
    return 'start test';
}