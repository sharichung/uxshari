const fs = require("fs");
const path = require("path");

// 工具：確保資料夾存在
function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

// 頁面對應樣式配置（可擴充）
const pageConfig = {
    "index.html": "funnel",
    "login.html": "funnel",
    "dashboard.html": "dashboard",
    "lesson.html": "dashboard"
};

// 處理 HTML views（支援多頁）
const viewFiles = fs.readdirSync("src/views").filter(file => file.endsWith(".html"));

viewFiles.forEach(file => {
    const pageType = pageConfig[file] || "funnel"; // 預設為 funnel

    const navbar = fs.readFileSync(`src/components/${pageType}-navbar.html`, "utf-8");
    const footer = fs.readFileSync(`src/components/${pageType}-footer.html`, "utf-8");

    let html = fs.readFileSync(path.join("src/views", file), "utf-8");

    // 插入對應 style, navbar, footer
    const cssLink = `<link rel="stylesheet" href="assets/css/${pageType}.css">`;
    html = html
        .replace("<!-- INCLUDE:style -->", cssLink)
        .replace("<!-- INCLUDE:navbar -->", navbar)
        .replace("<!-- INCLUDE:footer -->", footer);

    // 修正資源路徑：避免 ./ 或 / 開頭錯誤
    html = html.replace(/(src|href)="\.?\/?(assets\/[^"]+)"/g, '$1="$2"');
    html = html.replace(/(src|href)="\.?\/?(css\/[^"]+)"/g, '$1="assets/$2"');
    html = html.replace(/(src|href)="\.?\/?(js\/[^"]+)"/g, '$1="assets/$2"');

    // 輸出至 docs/
    ensureDir("docs");
    fs.writeFileSync(path.join("docs", file), html);
    console.log(`✅ 已處理 ${file}（樣式類型：${pageType}）`);
});

// 複製 CSS（複製所有樣式）
ensureDir("docs/assets/css");
const cssFiles = fs.readdirSync("src/css").filter(f => f.endsWith(".css"));
cssFiles.forEach(file => {
    fs.copyFileSync(`src/css/${file}`, `docs/assets/css/${file}`);
});

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
