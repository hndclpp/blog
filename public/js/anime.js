// 当前类型状态
let currentType = 'anime';

// 工具函数
const utils = {
    processImageUrl(url) {
        if (url.includes('i0.hdslb.com') || url.includes('i1.hdslb.com') || url.includes('i2.hdslb.com')) {
            return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
        }
        return url;
    },

    formatNumber(num) {
        if (num >= 100000000) {
            return (num / 100000000).toFixed(1) + '亿';
        }
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        }
        return num;
    }
};

// 渲染函数
function renderAnime(data) {
    const container = document.getElementById('animeApp');
    const html = data.map(item => `
        <div class="anime-card">
            <div class="anime-cover">
                <img 
                    src="${utils.processImageUrl(item.cover)}" 
                    alt="${item.title}"
                    loading="lazy"
                >
                <div class="anime-description">
                    ${item.evaluate || '暂无简介'}
                </div>
            </div>
            <div class="anime-info">
                <div class="anime-title">
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a>
                </div>
                <div class="anime-meta">
                    <span>${item.new_ep?.index_show || ''}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// 数据获取函数
async function fetchAnime() {
    try {
        const fileName = currentType === 'anime' ? '/data/bangumi.json' : '/data/movies.json';
        const response = await fetch(fileName);
        const data = await response.json();
        renderAnime(data);
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 添加切换功能
function setupTabs() {
    const tabs = document.querySelectorAll('.anime-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentType = tab.dataset.type;
            fetchAnime();
        });
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    fetchAnime();
    setupTabs();
}); 