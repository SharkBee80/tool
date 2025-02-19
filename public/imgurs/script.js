function uploadImage() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    const token = localStorage.getItem('fyk-auth-token');

    if (files.length === 0) {
        noty('至少选择一张图片');
        return;
    }

    if (!token) {
        noty('Not logged in');
        document.getElementById('userInfo').innerHTML = '<a href="/auth">未登录</a>';
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]); // 'files' 是后端接收的字段名
    }

    fetch('/imgur/api', {
        method: 'POST',
        headers: {
            'fyk-auth-token': token
        },
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                noty('Image uploaded successfully');
                //fetchImages();
                update(data.images, 'POST');
            } else {
                noty('Error uploading image');
            }
        })
}

async function fetchImages() {
    const token = localStorage.getItem('fyk-auth-token');
    if (!token) {
        noty('Not logged in');
        return;
    }

    const response = await fetch('/imgur/api', {
        method: 'GET',
        headers: {
            'fyk-auth-token': token
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                noty(data.error);
                document.getElementById('userInfo').innerHTML = '<a href="/auth">未登录</a>';
                return;
            }
            noty('Image fetched successfully');
            update(data, 'GET');
        })
}

function deleteImage(id) {
    if (!id) {
        noty('Please select an image to delete.');
        return;
    }
    const token = localStorage.getItem('fyk-auth-token');
    if (!token) {
        noty('Not logged in');
        document.getElementById('userInfo').innerHTML = '<a href="/auth">未登录</a>';
        return;
    }

    fetch(`/imgur/api/${id}`, {
        method: 'DELETE',
        headers: {
            'fyk-auth-token': token
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                noty('Image deleted successfully');
                updateDelete(id);
            } else if (data.error) {
                noty(data.error);
            }
            else {
                noty('Error deleting image');
            }
        })
}

function updateDelete(id) {
    const element = document.getElementById(id);
    element.remove();
}

let userInfoId;
function update(data, method) {
    const userInfo = document.getElementById('userInfo');
    const imageList = document.getElementById('imageList');
    // 遍历所有用户（所有键）
    const userEntries = Object.entries(data); // 返回 [userId, images] 的数组

    // 渲染所有用户的图片
    userEntries.map(([userId, images]) => {
        if (!userInfoId) {
            userInfoId = userId;
            userInfo.innerHTML = `User: ${userId}`;
        } else if (userInfoId !== userId) {
            noty('User changed');
            noty('刷新重试')
            return;
        }

        // 反转图片数组以显示最新的图片在顶部
        images.reverse();
        imageList.innerHTML =
            (images[0] ?
                `
                    ${images.map(img => `
                        <div class="img-container" id="${img.id}">
                            <div class="text">        
                                <p>图片Id: <a href="/imgur/${img.id}">${img.id}</a></p>
                                <p>图片名: ${img.originalname}</p>
                                <p>图片链接: <a href="${img.path}">${img.path}</a></p>   
                                <p>上传时间: ${img.uploadTime}</p>
                            </div>
                            <img src="/imgur/${img.id}" alt="${img.originalname}" width='64'/>
                            <button onclick="deleteImage('${img.id}')">删除</button>
                        </div>
                    `).join('')}
                ` : ((method === 'GET') ? (imageList.innerHTML + `<p id="noImage">No image found.</p>`) : ''))
            + ((method === 'POST') ? imageList.innerHTML : '');
    }).join('');
}

// 页面加载时检查是否已登录
window.onload = () => {
    if (localStorage.getItem('fyk-auth-token')) {
        fetchImages();
    } else {
        noty('Not logged in');
        document.getElementById('userInfo').innerHTML = '<a href="/auth">未登录</a>';
    }
};