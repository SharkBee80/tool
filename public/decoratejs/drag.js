(function () {
    // 颜色和元素的定义
    var color = "rgba(0, 0, 0, 0.5)";
    var scolor = "rgba(0, 0, 0, 0.4)";
    var elementGroup = [];
    var lifeSpan = 10;
    // 全局变量记录上一次鼠标位置
    let lastX = null;
    let lastY = null;
    // 存储上一次的触摸位置，支持多个触摸点
    let touchPositions = {}; // {touchId: {lastX, lastY}}
    // 最大圆点数量
    const MAX_ELEMENTS = 120;
    var o = 2; // 每隔 o个 像素插一个点
    var size = 10 // 圆点的大小

    // 定义圆点类
    class Element {
        constructor() {
            this.lifeSpan = lifeSpan;  // 初始生命周期
            this.initialStyles = {
                position: "fixed",
                top: "0",
                left: "0",
                display: "block",
                pointerEvents: "none",
                "z-index": "1",
                width: size + "px",  // 圆点的大小
                height: size + "px",
                borderRadius: "50%",  // 使元素变成圆形
                "will-change": "transform",
                backgroundColor: color,  // 初始颜色，后续会被覆盖
                "box-shadow": "0 0 " + size / 2 + "px " + scolor,

            };
        }

        // 初始化圆点
        init(x, y, color) {
            this.position = { x: x - 6, y: y - 6 };  // 初始位置
            //this.initialStyles.backgroundColor = color;
            this.element = document.createElement("div");
            ApplyStyle(this.element, this.initialStyles);
            this.update();
            document.body.appendChild(this.element);
        }

        // 更新圆点
        update() {
            // 更新位置并缩放
            this.lifeSpan--;  // 生命周期减少
            this.element.style.transform = "translate3d(" + this.position.x + "px," + this.position.y + "px, 0) scale(" + this.lifeSpan / lifeSpan + ")";
        }

        // 销毁圆点
        die() {
            this.element.parentNode.removeChild(this.element);
        }
    }

    // 添加事件监听器
    AddListener();

    // 循环渲染元素
    setInterval(function () {
        Render();
    }, lifeSpan / 60);

    // 监听事件
    function AddListener() {
        document.addEventListener("mousemove", onMove);
        window.addEventListener("touchmove", Touch);
        //document.addEventListener("touchstart", onMove);
        document.addEventListener("mouseleave", onLeave);
    }

    // 渲染元素
    function Render() {
        for (var i = 0; i < elementGroup.length; i++) {
            elementGroup[i].update();
            if (elementGroup[i].lifeSpan < 0) {
                elementGroup[i].die();
                elementGroup.splice(i, 1);  // 删除已销毁的元素
            }
        }
    }

    // 鼠标移动事件
    function onMove(e) {
        if (lastX === null || lastY === null) {
            // 如果是第一次移动，直接生成元素
            CreateElement(e.clientX, e.clientY, color);
            lastX = e.clientX;
            lastY = e.clientY;
        } else {
            // 计算两点间的距离
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 根据距离插值生成点
            const steps = Math.ceil(distance / o); // 每隔 o个 像素插一个点
            for (let i = 1; i <= steps; i++) {
                const interpolatedX = lastX + (dx * i) / steps;
                const interpolatedY = lastY + (dy * i) / steps;
                CreateElement(interpolatedX, interpolatedY, color);
            }

            // 更新上次位置
            lastX = e.clientX;
            lastY = e.clientY;
        }
    }

    // 创建新元素
    function CreateElement(x, y, color) {
        var e = new Element();
        e.init(x, y, color);
        elementGroup.push(e);

        // 如果圆点数量超过限制，移除最早的圆点
        if (elementGroup.length > MAX_ELEMENTS) {
            elementGroup[0].die();
            elementGroup.shift();
        }
    }

    // 设置元素样式
    function ApplyStyle(element, style) {
        for (var i in style) {
            element.style[i] = style[i];
        }
    }

    // 触摸事件
   // 触摸事件
   function Touch(e) {
    if (e.touches.length > 0) {
        for (var i = 0; i < e.touches.length; i++) {
            const touchId = e.touches[i].identifier;

            if (!touchPositions[touchId]) {
                touchPositions[touchId] = { lastX: e.touches[i].clientX, lastY: e.touches[i].clientY };
                // 如果是第一次触摸，直接生成元素
                CreateElement(e.touches[i].clientX, e.touches[i].clientY, color);
            } else {
                // 计算两点间的距离
                const dx = e.touches[i].clientX - touchPositions[touchId].lastX;
                const dy = e.touches[i].clientY - touchPositions[touchId].lastY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // 根据距离插值生成点
                const steps = Math.ceil(distance / o); // 每隔 o个 像素插一个点
                for (let j = 1; j <= steps; j++) {
                    const interpolatedX = touchPositions[touchId].lastX + (dx * j) / steps;
                    const interpolatedY = touchPositions[touchId].lastY + (dy * j) / steps;
                    CreateElement(interpolatedX, interpolatedY, color);
                }
            }

            // 更新触摸点的上次位置
            touchPositions[touchId].lastX = e.touches[i].clientX;
            touchPositions[touchId].lastY = e.touches[i].clientY;
        }
    }
}

    // 当鼠标移出屏幕时，重置位置
    function onLeave() {
        lastX = null;
        lastY = null;
    }
})();
