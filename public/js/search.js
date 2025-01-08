// 全局变量
let searchTimeout = null;
let lastSearchTerm = '';
let allPosts = [];

// 初始化搜索功能
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const tagsSection = document.querySelector('.tags-section');
    const categoriesSection = document.querySelector('.categories-section');
    const searchResults = document.querySelector('.search-results');
    
    if (!searchInput) return;
    
    // 创建搜索结果容器
    if (!searchResults) {
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'search-results';
        searchInput.parentElement.appendChild(resultsDiv);
    }
    
    // 创建加载动画
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'search-loading';
    loadingDiv.innerHTML = '<div class="loading-spinner"></div>';
    searchInput.parentElement.appendChild(loadingDiv);
    
    // 获取所有文章数据
    fetchAllPosts();
    
    // 监听输入事件
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        
        // 清除之前的定时器
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // 如果搜索词为空，显示标签和分类
        if (!searchTerm) {
            if (tagsSection) tagsSection.style.display = 'block';
            if (categoriesSection) categoriesSection.style.display = 'block';
            searchResults.style.display = 'none';
            loadingDiv.classList.remove('active');
            return;
        }
        
        // 如果搜索词与上次相同，不重复搜索
        if (searchTerm === lastSearchTerm) return;
        
        // 显示加载动画
        loadingDiv.classList.add('active');
        
        // 隐藏标签和分类
        if (tagsSection) tagsSection.style.display = 'none';
        if (categoriesSection) categoriesSection.style.display = 'none';
        
        // 延迟执行搜索
        searchTimeout = setTimeout(() => {
            performSearch(searchTerm);
            loadingDiv.classList.remove('active');
        }, 300);
    });
}

// 获取所有文章数据
async function fetchAllPosts() {
    try {
        const response = await fetch('/index.json');
        const data = await response.json();
        allPosts = data.posts || [];
    } catch (error) {
        console.error('获取文章数据失败:', error);
    }
}

// 执行搜索
function performSearch(searchTerm) {
    const searchResults = document.querySelector('.search-results');
    
    // 在所有文章中搜索
    const results = allPosts.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(searchTerm);
        const contentMatch = post.content.toLowerCase().includes(searchTerm);
        return titleMatch || contentMatch;
    }).slice(0, 10); // 最多显示10条结果
    
    // 渲染搜索结果
    renderSearchResults(results, searchTerm);
    
    // 更新上次搜索词
    lastSearchTerm = searchTerm;
    
    // 显示搜索结果
    searchResults.style.display = 'block';
}

// 渲染搜索结果
function renderSearchResults(results, searchTerm) {
    const searchResults = document.querySelector('.search-results');
    
    if (!results || results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">未找到相关内容</div>';
        return;
    }
    
    const html = results.map(result => {
        // 获取内容预览
        const previewContent = getPreviewContent(result.content, searchTerm);
        
        return `
            <div class="search-result-item">
                <a href="${result.url}" class="search-result-title">${highlightText(result.title, searchTerm)}</a>
                <div class="search-result-content">${previewContent}</div>
                <div class="search-result-meta">${result.date}</div>
            </div>
        `;
    }).join('');
    
    searchResults.innerHTML = html;
}

// 获取内容预览
function getPreviewContent(content, searchTerm) {
    const maxLength = 100;
    const words = content.split(/\s+/);
    let preview = '';
    
    // 查找包含搜索词的位置
    const searchIndex = words.findIndex(word => 
        word.toLowerCase().includes(searchTerm)
    );
    
    if (searchIndex === -1) {
        // 如果没找到，返回开头的内容
        preview = words.slice(0, 20).join(' ');
    } else {
        // 从搜索词前后各取一些词
        const start = Math.max(0, searchIndex - 10);
        const end = Math.min(words.length, searchIndex + 10);
        preview = words.slice(start, end).join(' ');
    }
    
    // 截断过长的内容
    if (preview.length > maxLength) {
        preview = preview.substring(0, maxLength) + '...';
    }
    
    return highlightText(preview, searchTerm);
}

// 高亮搜索词
function highlightText(text, searchTerm) {
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initSearch);
