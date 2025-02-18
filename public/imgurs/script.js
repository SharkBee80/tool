function uploadImage() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;

    if (files.length === 0) {
        noty('Please select at least one file.');
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]); // 'files' 是后端接收的字段名
    }

    fetch('/imgur/api', {
        method: 'POST',
        headers: {
            'fyk-auth-token': localStorage.getItem('fyk-auth-token')
        },
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                noty('Image uploaded successfully');
                //fetchImages();
                updatePost(data.images);
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
                return;
            }
            noty('Image fetched successfully');
            const userInfo = document.getElementById('userInfo');
            const imageList = document.getElementById('imageList');
            // 遍历所有用户（所有键）
            const userEntries = Object.entries(data); // 返回 [userId, images] 的数组

            // 渲染所有用户的图片
            userEntries.map(([userId, images]) => {
                userInfo.innerHTML = `User: ${userId}`;
                // 反转图片数组以显示最新的图片在顶部
                images.reverse();
                imageList.innerHTML = images[0] ?
                    `
                        ${images.map(img => `
                            <div class="img-container" id="${img.id}">
                                <div class="text">        
                                    <p>图片Id: ${img.id}</p>
                                    <p>图片名: ${img.originalname}</p>
                                    <p>图片链接: ${img.path}</p>   
                                </div>
                                <img src="/imgur/${img.id}" alt="${img.originalname}" width='64'/>
                                <button onclick="deleteImage('${img.id}')">删除</button>
                            </div>
                        `).join('')}
                    ` : `<p id="noImage">No image found.</p>`;
            }).join('');
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

function updatePost(images) {
    const imageList = document.getElementById('imageList');
    imageList.innerHTML = `
        ${images.map(img => `
            <div class="img-container" id="${img.id}">
                <div class="text">        
                    <p>图片Id: ${img.id}</p>
                    <p>图片名: ${img.originalname}</p>
                    <p>图片链接: ${img.path}</p>   
                </div>
                <img src="/imgur/${img.id}" alt="${img.originalname}" width='64'/>
                <button onclick="deleteImage('${img.id}')">删除</button>
            </div>
        `).join('')}
        ` + imageList.innerHTML;
}

// 页面加载时检查是否已登录
window.onload = () => {
    if (localStorage.getItem('fyk-auth-token')) {
        fetchImages();
    } else {
        noty('Not logged in');
        document.getElementById('UserInfo').innerHTML = '未登录';
    }
};