const fs = require("fs");
const path = require("path");

// 工具：確保資料夾存在
function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, {
        recursive: true
    });
}

// 插入 components
const navbar = fs.readFileSync("src/components/navbar.html", "utf-8");
const footer = fs.readFileSync("src/components/footer.html", "utf-8");

// 處理 HTML views（支援多頁）
const viewFiles = fs.readdirSync("src/views").filter(file => file.endsWith(".html"));

viewFiles.forEach(file => {
    let html = fs.readFileSync(path.join("src/views", file), "utf-8");

    // 插入組件
    html = html
        .replace("<!-- INCLUDE:navbar -->", navbar)
        .replace("<!-- INCLUDE:footer -->", footer);

    // 統一路徑為 /assets/...（避免重複或錯誤）
    // 只處理本地相對路徑開頭的資源，不碰 https:// 等外部資源
    html = html.replace(/(src|href)="\.?\/?(assets\/[^"]+)"/g, '$1="$2"');
    html = html.replace(/(src|href)="\.?\/?(css\/[^"]+)"/g, '$1="assets/$2"');
    html = html.replace(/(src|href)="\.?\/?(js\/[^"]+)"/g, '$1="assets/$2"');


    // 輸出至 docs/
    fs.writeFileSync(path.join("docs", file), html);
    console.log(`✅ 已處理 ${file}`);
});

// 複製 CSS
ensureDir("docs/assets/css");
fs.copyFileSync("src/css/style.css", "docs/assets/css/style.css");

// 複製 JS 資料夾
const jsDirs = ["auth", "layout", "visual"];
jsDirs.forEach(subdir => {
    const from = path.join("src/js", subdir);
    const to = path.join("docs/assets/js", subdir);
    ensureDir(to);
    if (fs.existsSync(from)) {
        const files = fs.readdirSync(from);
        files.forEach(file => {
            fs.copyFileSync(path.join(from, file), path.join(to, file));
        });
    }
});

// 複製根層 JS 檔案（排除資料夾）
ensureDir("docs/assets/js");
const allJs = fs.readdirSync("src/js");
allJs.forEach(file => {
    const fullPath = path.join("src/js", file);
    if (fs.statSync(fullPath).isFile() && file.endsWith(".js")) {
        fs.copyFileSync(fullPath, path.join("docs/assets/js", file));
    }
});

// 複製圖片
if (fs.existsSync("src/assets/images")) {
    ensureDir("docs/assets/images");
    const images = fs.readdirSync("src/assets/images");
    images.forEach(img => {
        fs.copyFileSync(`src/assets/images/${img}`, `docs/assets/images/${img}`);
    });
}

console.log("🎉 Build 完成，所有資源已移動並修正！");