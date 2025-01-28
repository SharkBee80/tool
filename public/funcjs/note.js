init();
// 获取文件列表并填充文件列表
async function init() {
    await fetch('/files')
        .then(response => response.json())
        .then(files => {
            const fileList = document.getElementById('fileList');
            files.forEach(file => {
                const listItem = document.createElement('li');

                // 格式化修改时间
                const mtime = new Date(file.mtime);
                const now = new Date();

                let formattedTime;
                if (mtime.toDateString() === now.toDateString()) {
                    // 如果是今天，显示时间
                    formattedTime = mtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                    // 如果不是今天，显示日期和时间
                    formattedTime = mtime.toLocaleString([], {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                }

                listItem.innerHTML = `<a id='n'>${file.name}</a><a id='t'>${formattedTime}</a>`;
                listItem.onclick = () => loadFile(file.name);
                fileList.appendChild(listItem);
            });
        });
}

// 加载选中的文件
function loadFile(fileName) {
    document.getElementById('notes').placeholder = "编辑文本..."
    // 高亮显示当前选中的文件
    const fileListItems = document.querySelectorAll('.file-list li');
    fileListItems.forEach(item => item.classList.remove('active'));
    const clickedItem = Array.from(fileListItems).find(item => {
        const n = item.querySelector('#n');
        return n && n.textContent === fileName && item.id !== 'new';
    });
    if (clickedItem) {
        clickedItem.classList.add('active');
    }

    // 获取文件内容并显示在编辑区域
    fetch(`/file/${fileName}`)
        .then(response => response.text())
        .then(data => {
            document.getElementById('notes').value = data;
        });
}

// 保存文件内容
function saveFile() {
    const selectedFile = document.querySelector('.file-list li.active');
    let fileName;
    if (!selectedFile || selectedFile.id === 'new') {
        fileName = prompt("输入新文件名:");
        if (fileName === null) return;
    } else {
        fileName = selectedFile.querySelector('#n').textContent;
    }
    const content = document.getElementById('notes').value;
    fetch(`/file/${fileName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
    })
        .then(response => response.text())
        .then(message => {
            noty(message);
            if (!selectedFile || selectedFile.id === 'new') {
                // 如果是新文件，添加到文件列表
                const newItem = document.createElement('li');
                const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                newItem.innerHTML = `<a id='n'>${fileName}</a><a id='t'>${formattedTime}</a>`;
                newItem.onclick = () => loadFile(fileName);
                document.getElementById('fileList').appendChild(newItem);
            }
            refresh(fileName);
        });
}

// 删除文件
function deleteFile() {
    const selectedFile = document.querySelector('.file-list li.active');
    const fileName = selectedFile.querySelector('#n').textContent;
    if (selectedFile === null || selectedFile.id === 'new') {
        return
    }
    if (confirm(`确定要删除文件 ${fileName} 吗？`)) {
        fetch(`/file/${fileName}`, {
            method: 'DELETE',
        })
            .then(response => response.text())
            .then(message => {
                noty(message);
                // 删除文件列表中的项
                const fileListItems = document.querySelectorAll('.file-list li');
                fileListItems.forEach(item => {
                    const n = item.querySelector('#n')
                    if (n && n.textContent.includes(fileName)) {
                        item.remove();
                    }
                });
                refresh();
                document.getElementById('notes').value = '';  // 清空编辑区域
                document.getElementById('notes').placeholder = "选择或创建文本..."
            });
    }

}

// 创建新文件，清空编辑区域
function createNewFile() {
    document.getElementById('notes').value = '';  // 清空编辑区域
    document.getElementById('notes').placeholder = "输入文本..."
    const fileListItems = document.querySelectorAll('.file-list li');
    fileListItems.forEach(item => item.classList.remove('active'));

    const clickedItem = Array.from(fileListItems).find(item => item.id === 'new');
    if (clickedItem) {
        clickedItem.classList.add('active');
    }
}

// 更新列表
async function refresh(saved) {
    // 删除文件列表中的项
    const fileListItems = document.querySelectorAll('.file-list li');
    fileListItems.forEach(item => {
        if (item.id !== 'new') {
            item.remove();
        };
    });
    await init();
    if (saved) {
        //setTimeout(`loadFile('${saved}')`, 20);
        loadFile(saved)
    };
}

function toggleFileList() {
    const fileList = document.querySelector('.file-list');
    fileList.classList.toggle('show');
    const ed = document.querySelector('.editor');

    fileList.style = 'height: ' + String(ed.clientHeight - 40) + 'px';
}

document.addEventListener('pointerdown', function (event) {
    // 这里可以通过 event.target 来判断是哪个具体的元素被点击
    const fileList = document.getElementById('file-list');
    // 如果点击的是 file-list 或其子元素，直接返回
    if (fileList && fileList.contains(event.target)) {
        return;
    }
    const e = window.getComputedStyle(document.querySelector('.file-list')).display
    if (window.innerWidth < 620 && e !== 'none') {
        toggleFileList();
    }
});