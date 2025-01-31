// 动态创建和应用CSS样式
const style = document.createElement('style');
style.innerHTML = `
            /* 气泡通知样式 */
            .notification {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(44, 42, 40, 0.95);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                opacity: 0;
                z-index: 9999;
                transition: opacity 0.5s ease-out, transform 0.5s ease-out;
            }

            .notification.show {
                display: block;
                opacity: 0;
                /* 显示时设置透明度为0 */
                transform: translateX(-50%) translateY(0);
                /* 显示时从顶部滑入 */
            }
        `;
// 将样式插入到页面的head中
document.head.appendChild(style);

// 显示气泡通知
function noty(message) {
    // 动态创建气泡通知元素
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.innerText = message;

    // 将气泡通知添加到页面中
    document.body.appendChild(notification);

    // 触发显示效果
    setTimeout(() => {
        notification.style.opacity = 1;
        notification.style.transform = 'translateX(-50%) translateY(20px)';
    }, 500);

    // 3秒后自动消失
    setTimeout(() => {
        notification.style.opacity = 0;
        notification.style.transform = 'translateX(-50%) translateY(-20px)';

        // 消失后删除元素
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}