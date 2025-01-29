function doubleChild() {
    // 获取所有 class 为 child 的 div 元素
    const children = document.querySelectorAll('.child');

    // 遍历每个 child
    children.forEach((child) => {
        // 统计 child 内 a 标签的数量
        const aCount = child.querySelectorAll('a').length;

        // 判断 aCount 是否为奇数
        if (aCount % 2 !== 0) {
            // 创建一个新的 a 标签
            const newa = document.createElement('a');
            //newa.href = ""; // 可以设置为需要的链接
            //newa.target = "_self";
            newa.textContent = ""; // 设置 a 标签的文本
            newa.style = "background: none;box-shadow: none;border: none;"; //pointer-events:none;

            // 将新的 a 标签添加到 child 中
            child.appendChild(newa);
        }
    });
};
