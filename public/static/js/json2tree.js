const area_json = document.getElementById("area_json");
const area_tree = document.getElementById("area_tree");

function toTree() {
    let json = area_json.innerText;
    if (json) {
        try {
            const jsonObj = JSON.parse(json);
            area_tree.innerHTML = '';
            buildTree(jsonObj, area_tree, 'root');

        } catch (e) {
            area_tree.innerHTML = '<p style="color: red";>Invalid JSON</p>'
        }
    }

}

function toJson() {
    let tree = area_tree.innerText;
    if (tree) {
    }
}

function buildTree(obj, parentElement, key) {
    const item = document.createElement('div');
    parentElement.appendChild(item);

    if (typeof obj === 'object' && obj !== null) {
        const keySpan = document.createElement('span');
        keySpan.className = 'key collapsible collapsed';
        keySpan.textContent = key + ': ';
        item.appendChild(keySpan);

        const childContainer = document.createElement('div');
        childContainer.className = 'hidden ' + (Array.isArray(obj) ? 'array' : 'object');
        childContainer.style = 'display:block'
        item.appendChild(childContainer);

        for (const childKey in obj) {
            buildTree(obj[childKey], childContainer, childKey);
            keySpan.onclick = function (event) {
                event.stopPropagation();
                const childDiv = this.parentElement.querySelector('.hidden');
                if (childDiv.style.display === 'block') {
                    childDiv.style.display = 'none';
                    this.classList.remove('collapsed');
                } else {
                    childDiv.style.display = 'block';
                    this.classList.add('collapsed');
                }
            }
        }
    } else {
        item.innerHTML = '<span class="key">' + key + ': </span>' + '<span class="' + getType(obj) + '">' + obj + '</span>';
    }
}

function getType(value) {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    return 'unknown';
}

function cleanup() {
    area_json.innerHTML = ''
    area_tree.innerHTML = ''
}

toTree()

area_json.addEventListener('keydown', function (event) {
    // 检查是否按下了 Tab 键（keyCode 9）
    if (event.key === 'Tab') {
        event.preventDefault();  // 阻止按键的默认行为
        keydowns(area_json,"  ",2)
    }
    if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();  // 阻止按键的默认行为
        keydowns(area_json,"\n",1)
    } else if (event.key === 'Enter') {
        event.preventDefault();  // 阻止按键的默认行为
        toTree()
    }
});

function keydowns(element,key,leng) {
    // 获取当前选区（光标）的位置
    const selection = window.getSelection();
    const range = selection.getRangeAt(0); // 获取当前选区的范围
    const cursorPosition = range.startOffset; // 获取光标的位置

    // 获取光标前后的文本
    const textBefore = element.textContent.substring(0, cursorPosition);
    const textAfter = element.textContent.substring(cursorPosition);

    // 插入制表符并更新文本内容
    element.textContent = textBefore + key + textAfter;

    // 更新光标位置：将光标移动到制表符之后
    const newRange = document.createRange();
    newRange.setStart(element.firstChild, textBefore.length + leng); // 光标放在制表符后
    newRange.setEnd(element.firstChild, textBefore.length + leng);

    // 清除当前选区并设置新的光标位置
    selection.removeAllRanges();
    selection.addRange(newRange);

}