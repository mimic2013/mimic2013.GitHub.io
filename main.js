// --- 基本设置 ---
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// --- 布局常量 ---
const NUM_COLUMNS = 3; // 我们想要3列布局
const GAP = 20; // 图片之间的间距

// 计算每列的宽度
const COLUMN_WIDTH = (canvas.width - (NUM_COLUMNS + 1) * GAP) / NUM_COLUMNS;

// --- 状态变量 ---
let scrollY = 0; // 虚拟滚动距离
let imageLayouts = []; // 存储每张图片计算好的位置和尺寸
let allImagesLoaded = false;
let maxColumnHeight = 0; // 所有列中最高的高度

// --- 核心逻辑：预加载图片并计算布局 ---
function preloadImagesAndLayout() {
    let loadedImageCount = 0;
    const imagesToLoad = imageData.length;
    const loadedImages = [];

    imageData.forEach((data, index) => {
        const img = new Image();
        img.src = data.imageSrc;
        img.onload = () => {
            loadedImages[index] = img; // 保持原始顺序
            loadedImageCount++;
            if (loadedImageCount === imagesToLoad) {
                // 所有图片都加载完毕后，才开始计算布局
                calculateLayout(loadedImages);
            }
        };
    });
}

// --- 布局算法：瀑布流 ---
function calculateLayout(images) {
    let columnHeights = new Array(NUM_COLUMNS).fill(0); // [0, 0, 0]

    images.forEach((img, index) => {
        // 1. 计算图片按比例缩放后的高度
        const aspectRatio = img.height / img.width;
        const scaledHeight = COLUMN_WIDTH * aspectRatio;

        // 2. 找到当前最短的列
        let minHeight = Math.min(...columnHeights);
        let columnIndex = columnHeights.indexOf(minHeight);

        // 3. 计算图片的位置
        const x = GAP + columnIndex * (COLUMN_WIDTH + GAP);
        const y = columnHeights[columnIndex];

        // 4. 存储这张图片的布局信息
        imageLayouts.push({
            img: img,
            x: x,
            y: y,
            width: COLUMN_WIDTH,
            height: scaledHeight,
            description: imageData[index].description
        });

        // 5. 更新这一列的高度
        columnHeights[columnIndex] += scaledHeight + GAP;
    });
    
    maxColumnHeight = Math.max(...columnHeights); // 记录内容的总高度
    allImagesLoaded = true;
    draw(); // 布局计算完毕后，进行第一次绘制
}


// --- 核心绘制函数 ---
function draw() {
    if (!allImagesLoaded) return; // 如果布局还没计算好，就不绘制

    // 1. 清空画布
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 遍历所有计算好的布局信息并绘制
    imageLayouts.forEach(layout => {
        const drawY = layout.y - scrollY;

        // **优化：只绘制在可视区域内的图片**
        if (drawY + layout.height > 0 && drawY < canvas.height) {
            // 绘制图片
            ctx.drawImage(layout.img, layout.x, drawY, layout.width, layout.height);
            
            // 绘制描述文字
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            // 文字画在图片下方
            const textY = drawY + layout.height + 15;
            ctx.fillText(layout.description, layout.x, textY);
        }
    });
}

// --- 交互逻辑：鼠标滚轮 ---
canvas.addEventListener('wheel', function(event) {
    event.preventDefault();
    scrollY += event.deltaY * 0.5;

    // 设置滚动边界
    const maxScroll = maxColumnHeight - canvas.height + GAP*2;
    if (scrollY < 0) scrollY = 0;
    if (scrollY > maxScroll) scrollY = maxScroll;
    
    // 滚动后立即重绘
    requestAnimationFrame(draw);
});


// --- 初始加载 ---
preloadImagesAndLayout();