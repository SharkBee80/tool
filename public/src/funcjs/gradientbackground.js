//API https://sarcadass.github.io/granim.js/api-v2.0.0.html 

var granimInstance = new Granim({
    element: '#canvas-basic', // 定位元素
    name: 'granim', //name
    elToSetClassOn: 'body', 
    direction: 'left-right', // 动画方向'diagonal'-'对角线','left-right'-“左右”,'top-bottom'-“顶底”,'radial'-“径向”
    isPausedWhenNotInView: true, // 当不在视图时暂停动画
    scrollDebounceThreshold: 300,
    stateTransitionSpeed: 1000, // 设置渐变的过渡速度，单位是毫秒。默认值是1000
    /*
    image : {
        source: '../assets/img/bg-forest.jpg',
        position: ['center', 'bottom'],
        stretchMode: ['stretch', 'stretch-if-bigger'],
        blendingMode: 'multiply',
    },*/
    states : {
        "default-state": {
            gradients: [
                ['#f6d365', '#fda085'], // 浅橙到粉色
                ['#ff9a8b', '#ffc3a0'], // 玫瑰色到浅粉色
                ['#ff7e5f', '#feb47b'], // 玫瑰红到橙色
                ['#f39c12', '#f1c40f'], // 橙色到亮黄色
                ['#6a11cb', '#2575fc'], // 紫色到蓝色
                ['#fad0c4', '#ffd1ff'], // 浅粉到淡紫
                ['#00d2ff', '#3a7bd5'], // 浅蓝到深蓝
                ['#ff6a00', '#ee0979'], // 橙色到粉红
                ['#2c3e50', '#2980b9'], // 深灰到亮蓝
                ['#212f3c', '#1abc9c'], // 深蓝到蓝绿
                ['#2c3e50', '#34495e'], // 深蓝到暗蓝
                ['#3e4e5e', '#566573'], // 深绿色到青灰
                ['#1e272e', '#2f3640'], // 黑色到深灰
                ['#2d3436', '#636e72']  // 暗灰到灰色
            ],
            //transitionSpeed: 5000,
            loop: true // 渐变不断循环
        }
    },
    /*
    onStart: function() {
        console.log('Granim: onStart');
    },
    onGradientChange: function(colorDetails) {
        console.log('Granim: onGradientChange, details: ');
        console.log(colorDetails);
    },
    onEnd: function() {
        console.log('Granim: onEnd');
    }
    */
});