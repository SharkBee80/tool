async function uploadImage() {
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
        const file = files[i];
        const encodedName = btoa(encodeURIComponent(file.name)); // 将文件名编码URI并转换为Base64
        formData.append('files', file, encodedName); // 添加文件到 FormData
    }

    await fetch('/imgur/api', {
        method: 'POST',
        headers: {
            'fyk-auth-token': token,
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
            'fyk-auth-token': token,
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data; charset=UTF-8' // 确保编码为 UTF-8
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

async function deleteImage(id) {
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

    await fetch(`/imgur/api/${id}`, {
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
                            <div class="img-box img-bg">
                                <img src="/imgur/${img.id}" alt="${img.originalname}" loading="lazy" onclick="zoomImage('_${img.id}')" id='_${img.id}'/>
                            </div>
                            <button onclick="deleteImage('${img.id}')">删除</button>
                        </div>
                    `).join('')}
                ` : ((method === 'GET') ? (imageList.innerHTML + `<p id="noImage">No image found.</p>`) : ''))
            + ((method === 'POST') ? imageList.innerHTML : '');
    }).join('');
}

// 点击图片放大或缩小的函数
function zoomImage(imageId) {
    const images = document.querySelectorAll('img.zoomed');
    images.forEach(function (img) {
        if (img.id !== imageId) {
            img.classList.remove('zoomed');
        }
    });

    const image = document.getElementById(imageId);
    if (image) {
        image.classList.toggle('zoomed');
    }
}

// 点击页面其他区域时，取消所有图片的放大效果
document.addEventListener('click', function (event) {
    if (!event.target.matches('img')) {
        const images = document.querySelectorAll('img.zoomed');
        images.forEach(function (img) {
            img.classList.remove('zoomed');
        });
    }
});

// 检查auth
function isauth() {
    const token = localStorage.getItem('fyk-auth-token');
    if (token) {
        const result = fetch('/auth/check', {
            method: 'GET',
            headers: {
                'fyk-auth-token': token
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    //...
                    return true;
                } else if (data.error) {
                    localStorage.removeItem('fyk-auth-token');
                    //...
                    return false;
                } else {
                    return false;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                return false;
            })
        return result;
    } else {
        return false;
    }
}

// 页面加载时检查是否已登录
window.onload = () => {
    if (isauth()) {
        fetchImages();
    } else {
        noty('Not logging in');
        document.getElementById('userInfo').innerHTML = '<a href="/auth">未登录</a>';
    }
};