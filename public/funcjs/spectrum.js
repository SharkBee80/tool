/**
 * 为videojs使用的频谱spectrum
 * 1、<script src="spectrum.js"></script>  <!-- 引入 spectrum.js -->
 * 2、<audio crossorigin="anonymous"></audio>  <!-- 跨域访问 -->
 * 3、spectrum({}); //------注意{}
 */

let analyser, canvas, canvasObj, gradient;
let frequencyArray = []//采样频率缓冲数组
let transparent = 0.5;//透明度

/**
 * 
 * @param {Number} width 宽
 * @param {Number} height 高
 * @param {String} top 上边距顶部位置
 * @param {String} left 中轴距左侧位置
 * @param {String} z_index 层次
 * @param {Number} style 样式 (0 -> N) '单线效果', '竖线效果', '竖线+帽子', '柱子效果', '柱子+帽子', '柱子倒影', '爆炸效果'
 * @param {Number} transparents 透明度
 * @returns 
 */
function spectrum({ width = 336, height = 600, top = `calc(100vh - ${height / 2}px)`, left = '50%', z_index = 1, style = 4, transparents = 0.5 }) {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    // canvas元素
    document.body.insertAdjacentHTML('afterbegin', `<canvas id="canvas-spectrum" width="${width}" height="${height}" style="position: fixed; left: ${left};top: ${top};transform: translate(-50%, -50%);z-index: ${z_index}; pointer-events: none;"></canvas>`);
    canvas = document.getElementById("canvas-spectrum")
    canvasObj = {
        width: canvas.width,
        height: canvas.height,
        context: canvas.getContext("2d"),
        capYArray: new Array(1024).fill(0),
        playIng: false,
        style: 4,
        animation: null
    }
    transparent = transparents;
    // 颜色
    gradient = canvasObj.context.createLinearGradient(0, canvasObj.height * 0.5, 0, canvasObj.height) // x0,y0,x1,y1
    gradient.addColorStop(1, `rgba(0,255,0,${transparent})`)
    gradient.addColorStop(0.7, `rgba(255,255,0,${transparent})`)
    gradient.addColorStop(0, `rgba(255,0,0,${transparent})`)
    // 设置样式
    canvasObj.style = style;

    playSong(context);

    return true
}

//指定序号播放歌曲
function playSong(context) {
    // 获取 video.js 播放器的音频元素
    const audioElement = player.el().querySelector('audio');

    // 创建源节点并连接到音频分析器
    const source = context.createMediaElementSource(audioElement);
    analyser = context.createAnalyser();
    //analyser.fftSize = 1024;
    source.connect(analyser);
    analyser.connect(context.destination);

    frequencyArray = new Uint8Array(analyser.frequencyBinCount);

    if (!canvasObj.playIng) {
        canvasObj.playIng = true;
        canvasObj.animation = requestAnimationFrame(drawMeter);
    }
}

//绘画音乐动画
function drawMeter() {
    analyser.getByteFrequencyData(frequencyArray)
    let ctx = canvasObj.context
    ctx.clearRect(0, 0, canvasObj.width, canvasObj.height)

    switch (canvasObj.style) {
        case 0:
            ctx.beginPath()
            ctx.moveTo(0, canvasObj.height)
            for (var i = Math.min(frequencyArray.length, 336) - 1; i >= 0; i--) {
                ctx.lineTo(i, canvasObj.height - frequencyArray[i])
            }
            ctx.strokeStyle = "#ffff00" // 黄色
            ctx.stroke()
            break
        case 1:
        case 2:
            if (canvasObj.style === 2) {
                ctx.fillStyle = `rgba(255,255,255,${transparent})`//加上帽子
                for (var i = Math.min(frequencyArray.length, 336) - 1; i >= 0; i--) {
                    canvasObj.capYArray[i] = frequencyArray[i] < canvasObj.capYArray[i] ? canvasObj.capYArray[i] - 1 : frequencyArray[i]
                    ctx.fillRect(i, canvasObj.height - canvasObj.capYArray[i], 1, 2)
                }
            }
            ctx.fillStyle = gradient
            for (var i = Math.min(frequencyArray.length, 336) - 1; i >= 0; i--) {
                ctx.fillRect(i, canvasObj.height - Math.max(frequencyArray[i], 1), 1, canvasObj.height)
            }
            break
        case 3:
        case 4:
            if (canvasObj.style === 4) {
                ctx.fillStyle = `rgba(255,255,255,${transparent})`//加上帽子
                for (var i = Math.min(frequencyArray.length, 48) - 1; i >= 0; i--) {
                    canvasObj.capYArray[i] = frequencyArray[i * 12] < canvasObj.capYArray[i] ? canvasObj.capYArray[i] - 1 : frequencyArray[i * 12]
                    ctx.fillRect(i * 12, canvasObj.height - canvasObj.capYArray[i], 7, 2)
                }
            }
            ctx.fillStyle = gradient
            for (var i = Math.min(frequencyArray.length, 48) - 1; i >= 0; i--) {
                ctx.fillRect(i * 12, canvasObj.height - Math.max(frequencyArray[i * 12], 5), 7, canvasObj.height); //x0,y0,+x,+y
            }
            break
        case 5:
            ctx.fillStyle = `rgba(102,102,102,${transparent})`
            for (var i = Math.min(frequencyArray.length, 48) - 1; i >= 0; i--) {
                ctx.fillRect(i * 12, canvasObj.height - frequencyArray[i * 12] - 250, 7, frequencyArray[i * 12])
            }
            ctx.fillStyle = `rgba(51,51,51,${transparent})`
            for (var i = Math.min(frequencyArray.length, 48) - 1; i >= 0; i--) {
                ctx.fillRect(i * 12, canvasObj.height - 250, 7, frequencyArray[i * 12])
            }
            break
        case 6:
            circle(frequencyArray, "#ff0", ctx, 1)
            circle(frequencyArray, "#f60", ctx, 0.9)
            circle(frequencyArray, "#f30", ctx, 0.7)
            circle(frequencyArray, "#333", ctx, 0.6)
            break
    }
    if (canvasObj.playIng) {
        canvasObj.animation = requestAnimationFrame(drawMeter)
    }
}

// 圆大小
function circle(array, color, ctx, size) {
    ctx.moveTo(0, 0)
    ctx.beginPath()
    for (let i = 100, l = 0; i <= 459; i += 2, l += 2) {
        let radian = (2 * Math.PI / 360) * (l + 135)//手动移动90度
        const x = 168 + Math.sin(radian) * (array[i] + 40) * size
        const y = 300 - Math.cos(radian) * (array[i] + 40) * size
        ctx.lineTo(x, y)
    }
    ctx.strokeStyle = color
    ctx.closePath()
    ctx.stroke()
}
