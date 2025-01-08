// 全局变量
let allImages = [];
let currentCategory = 'all';
let currentSort = 'date-desc';
let currentImageIndex = 0;

// 工具函数
const utils = {
    // 根据文件名提取日期（假设文件名格式为：YYYY-MM-DD-title.ext）
    extractDate(filename) {
        const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : '1970-01-01';
    },
    
    // 排序函数
    sortImages(images, sortType) {
        const sorters = {
            'date-desc': (a, b) => b.date.localeCompare(a.date),
            'date-asc': (a, b) => a.date.localeCompare(b.date),
            'name-asc': (a, b) => a.name.localeCompare(b.name),
            'name-desc': (a, b) => b.name.localeCompare(a.name)
        };
        return [...images].sort(sorters[sortType]);
    },
    
    // 从文件名提取分类（假设文件名格式为：YYYY-MM-DD-category-title.ext）
    extractCategory(filename) {
        const parts = filename.split('-');
        if (parts.length >= 4) {
            return parts[3].toLowerCase();
        }
        return 'other';
    }
};

// 懒加载处理函数
function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;
                if (src) {
                    // 创建一个新的Image对象来预加载
                    const tempImage = new Image();
                    tempImage.onload = () => {
                        img.src = src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    };
                    tempImage.src = src;
                }
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.1
    });

    document.querySelectorAll('.gallery-image[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// 渲染函数
function renderGallery(images) {
    const container = document.getElementById('galleryApp');
    const filteredImages = currentCategory === 'all' 
        ? images 
        : images.filter(img => utils.extractCategory(img.name) === currentCategory);
    const sortedImages = utils.sortImages(filteredImages, currentSort);
    
    const html = sortedImages.map((image, index) => `
        <div class="gallery-card" data-image="${image.url}" data-index="${index}">
            <div class="gallery-image-wrapper">
                <img 
                    class="gallery-image" 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
                    data-src="${image.url}" 
                    alt="${image.name}"
                    loading="lazy"
                >
                <div class="gallery-info">
                    <div class="gallery-title">${image.name}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    setupImageModal();
    setupLazyLoading();
}

// 获取图片列表
async function fetchImages() {
    try {
        const response = await fetch('/data/images.json');
        allImages = await response.json();
        renderGallery(allImages);
    } catch (error) {
        console.error('加载图片数据失败:', error);
    }
}

// 设置图片预览模态框
function setupImageModal() {
    if (!document.querySelector('.gallery-modal')) {
        const modal = document.createElement('div');
        modal.className = 'gallery-modal';
        modal.innerHTML = `
            <div class="modal-container">
                <img class="modal-image">
                <button class="modal-prev">◀</button>
                <button class="modal-next">▶</button>
                <button class="modal-close">×</button>
                <div class="modal-info"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const closeBtn = modal.querySelector('.modal-close');
        const prevBtn = modal.querySelector('.modal-prev');
        const nextBtn = modal.querySelector('.modal-next');
        
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(currentImageIndex - 1);
        });
        
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(currentImageIndex + 1);
        });
        
        // 键盘导航
        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('active')) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    showImage(currentImageIndex - 1);
                    break;
                case 'ArrowRight':
                    showImage(currentImageIndex + 1);
                    break;
                case 'Escape':
                    modal.classList.remove('active');
                    break;
            }
        });
    }
    
    // 为每个图片卡片添加点击事件
    const cards = document.querySelectorAll('.gallery-card');
    const modal = document.querySelector('.gallery-modal');
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            currentImageIndex = parseInt(card.dataset.index);
            showImage(currentImageIndex);
            modal.classList.add('active');
        });
    });
}

// 显示指定索引的图片
function showImage(index) {
    const modal = document.querySelector('.gallery-modal');
    const modalImage = modal.querySelector('.modal-image');
    const modalInfo = modal.querySelector('.modal-info');
    const filteredImages = currentCategory === 'all' 
        ? allImages 
        : allImages.filter(img => utils.extractCategory(img.name) === currentCategory);
    const sortedImages = utils.sortImages(filteredImages, currentSort);
    
    if (index < 0) index = sortedImages.length - 1;
    if (index >= sortedImages.length) index = 0;
    
    currentImageIndex = index;
    const image = sortedImages[index];
    
    modalImage.src = image.url;
    modalInfo.textContent = `${image.name} (${index + 1}/${sortedImages.length})`;
}

// 设置分类和排序事件
function setupControls() {
    // 分类切换
    const categories = document.querySelectorAll('.gallery-category');
    categories.forEach(cat => {
        cat.addEventListener('click', () => {
            categories.forEach(c => c.classList.remove('active'));
            cat.classList.add('active');
            currentCategory = cat.dataset.category;
            renderGallery(allImages);
        });
    });
    
    // 排序切换
    const sortSelect = document.getElementById('gallerySort');
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderGallery(allImages);
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    fetchImages();
    setupControls();
}); 