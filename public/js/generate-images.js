const fs = require('fs');
const path = require('path');

// 支持的图片格式
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// 从文件名中提取信息
function extractImageInfo(filename) {
    const name = path.basename(filename, path.extname(filename));
    const parts = name.split('-');
    
    // 尝试提取日期
    let date = '1970-01-01';
    if (parts.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(parts.slice(0, 3).join('-'))) {
        date = parts.slice(0, 3).join('-');
    }
    
    // 尝试提取分类
    let category = 'other';
    if (parts.length >= 4) {
        category = parts[3].toLowerCase();
    }
    
    return {
        date,
        category,
        name
    };
}

// 扫描图片目录
function scanImages(directory) {
    const images = [];
    
    function scan(dir) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scan(fullPath);
            } else {
                const ext = path.extname(file).toLowerCase();
                if (imageExtensions.includes(ext)) {
                    // 获取相对路径，这里使用相对于博客根目录的路径
                    const relativePath = path.relative(path.join(__dirname, '../../../../static/images'), fullPath);
                    const imageInfo = extractImageInfo(file);
                    
                    images.push({
                        name: imageInfo.name,
                        category: imageInfo.category,
                        date: imageInfo.date,
                        url: '/images/' + relativePath.replace(/\\/g, '/'),
                    });
                }
            }
        });
    }
    
    scan(directory);
    return images;
}

// 主函数
function main() {
    // 修改为博客根目录下的 static/images 路径
    const imagesDir = path.join(__dirname, '../../../../static/images');
    // 输出到主题目录下的 data 文件夹
    const outputFile = path.join(__dirname, '../data/images.json');
    
    try {
        // 确保输出目录存在
        const outputDir = path.dirname(outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 扫描图片并生成数据
        const images = scanImages(imagesDir);
        
        // 按日期排序
        images.sort((a, b) => b.date.localeCompare(a.date));
        
        // 写入JSON文件
        fs.writeFileSync(outputFile, JSON.stringify(images, null, 2), 'utf8');
        console.log('图片数据已生成:', outputFile);
        console.log(`共处理 ${images.length} 张图片`);
        
        // 输出分类统计
        const categories = {};
        images.forEach(img => {
            categories[img.category] = (categories[img.category] || 0) + 1;
        });
        console.log('\n分类统计:');
        Object.entries(categories).forEach(([cat, count]) => {
            console.log(`${cat}: ${count}张`);
        });
        
    } catch (error) {
        console.error('生成图片数据失败:', error);
        process.exit(1);
    }
}

main(); 