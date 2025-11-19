const fs = require("fs");
const path = require("path");

// 先清空 docs 目錄，避免遺留舊檔（保留 CNAME/.nojekyll）
function cleanDocs(dir = "docs") {
    if (!fs.existsSync(dir)) return;
    const preserve = new Map();
    ["CNAME", ".nojekyll"].forEach((name) => {
        const p = path.join(dir, name);
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            preserve.set(name, fs.readFileSync(p));
        }
    });
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    // 還原保留檔
    preserve.forEach((buf, name) => {
        fs.writeFileSync(path.join(dir, name), buf);
    });
}

// 工具：確保資料夾存在
function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

// 頁面對應樣式配置（可擴充）
const pageConfig = {
    "index.html": "funnel",
    "dashboard.html": "general",
    "account.html": "general",
    "lesson.html": "general",
};

// 取得 src/views 下所有 .html（排除 assets 與 components）
function getAllHtmlFiles(dir, base = "") {
    const full = path.join(dir, base);
    const entries = fs.readdirSync(full, { withFileTypes: true });
    const out = [];
    for (const e of entries) {
        if (e.isDirectory()) {
            if (["assets", "components"].includes(e.name)) continue;
            out.push(...getAllHtmlFiles(dir, path.join(base, e.name)));
        } else if (e.isFile() && e.name.endsWith(".html")) {
            out.push(path.join(base, e.name));
        }
    }
    return out;
}

// 先乾淨化輸出目錄，避免殘留舊版頁面
cleanDocs("docs");

// 處理 HTML views（支援子資料夾）
const viewFiles = getAllHtmlFiles("src/views");

viewFiles.forEach(relPath => {
    const srcPath = path.join("src/views", relPath);
    let html = fs.readFileSync(srcPath, "utf-8");
    
    // ✅ 檢查 HTML 中的 data-navbar-type 屬性
    const dataNavbarTypeMatch = html.match(/<body[^>]*data-navbar-type=["']([^"']+)["']/);
    const fileName = path.basename(relPath);
    const pageType = dataNavbarTypeMatch ? dataNavbarTypeMatch[1] : (pageConfig[fileName] || "funnel"); // 先檢查 data-navbar-type，再用 pageConfig，最後預設為 funnel

    // ✅ 讀取 navbar 和 footer
    const navbarPath = `src/views/components/${pageType}-navbar.html`;
    const footerPath = `src/views/components/${pageType}-footer.html`;
    
    let navbar = "";
    let footer = "";
    
    if (fs.existsSync(navbarPath)) {
        navbar = fs.readFileSync(navbarPath, "utf-8");
    }
    if (fs.existsSync(footerPath)) {
        footer = fs.readFileSync(footerPath, "utf-8");
    }

// 🔍 除錯訊息
if (fileName === "index.html") {
    console.log(`📝 處理 ${relPath}`);
    console.log(`✓ Navbar 路徑: ${navbarPath}`);
    console.log(`✓ Navbar 內容長度: ${navbar.length} 字元`);
    console.log(`✓ 原始 HTML 中的 navbar div: ${html.includes('<div id="navbar"></div>')}`);
}

// ✅ 直接注入 navbar（不管後面有沒有 script）
const beforeReplace = html;
html = html.replace(
    /<div id="navbar"><\/div>/g,  // ← 加入 /g 全局匹配
    `<div id="navbar">${navbar}</div>`
);

if (fileName === "index.html") {
    console.log(`✓ 注入前是否找到 div id="navbar": ${beforeReplace.includes('<div id="navbar"></div>')}`);
    console.log(`✓ 注入後包含 navbar 內容: ${html.includes('fab fa-slack')}`);
    console.log(`✓ HTML 是否改變: ${beforeReplace !== html}`);
}

//// ✅ 移除舊 footer，再注入新的（避免重複）
// 移除所有可能的 footer 格式
html = html.replace(/<footer[^>]*>[\s\S]*?<\/footer>/g, '');  // 移除所有 footer
html = html.replace(/<\/main>/, `${footer}\n</main>`);
    
    // 插入對應 CSS
    const cssLink = `<link rel="stylesheet" href="assets/css/${pageType}.css">`;
    html = html.replace("<!-- INCLUDE:style -->", cssLink);

    // 修正資源路徑
    html = html.replace(/(src|href)="\.?\/?(assets\/[^"]+)"/g, '$1="$2"');
    html = html.replace(/(src|href)="\.?\/?(css\/[^"]+)"/g, '$1="assets/$2"');
    html = html.replace(/(src|href)="\.?\/?(js\/[^"]+)"/g, '$1="assets/$2"');

    // 輸出至 docs/（保留相對路徑）
    const outPath = path.join("docs", relPath);
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, html);
    console.log(`✅ 已處理 ${relPath}（樣式類型：${pageType}）`);
});

// 複製 CSS
ensureDir("docs/assets/css");
if (fs.existsSync("src/views/assets/css")) {
    const cssFiles = fs.readdirSync("src/views/assets/css").filter(f => f.endsWith(".css"));
    cssFiles.forEach(file => {
        fs.copyFileSync(`src/views/assets/css/${file}`, `docs/assets/css/${file}`);
    });
}

// 複製 JS 資料夾
const jsDirs = ["auth", "layout", "visual", "pages"];
jsDirs.forEach(subdir => {
    const from = path.join("src/views/assets/js", subdir);
    const to = path.join("docs/assets/js", subdir);
    ensureDir(to);
    if (fs.existsSync(from)) {
        const files = fs.readdirSync(from);
        files.forEach(file => {
            fs.copyFileSync(path.join(from, file), path.join(to, file));
        });
    }
});

// 複製根層 JS 檔案
ensureDir("docs/assets/js");
const jsDir = "src/views/assets/js";
if (fs.existsSync(jsDir)) {
    const allJs = fs.readdirSync(jsDir);
    allJs.forEach(file => {
        const fullPath = path.join(jsDir, file);
        if (fs.statSync(fullPath).isFile() && file.endsWith(".js")) {
            fs.copyFileSync(fullPath, path.join("docs/assets/js", file));
        }
    });
}

// 複製 Components（Navbar/Footer）
ensureDir("docs/components");
const compsDir = "src/views/components";
if (fs.existsSync(compsDir)) {
    const compFiles = fs.readdirSync(compsDir).filter(f => f.endsWith(".html"));
    compFiles.forEach(file => {
        fs.copyFileSync(path.join(compsDir, file), path.join("docs/components", file));
    });
}

// 複製圖片
if (fs.existsSync("src/views/assets/images")) {
    ensureDir("docs/assets/images");
    const images = fs.readdirSync("src/views/assets/images");
    images.forEach(img => {
        const srcPath = path.join("src/views/assets/images", img);
        const destPath = path.join("docs/assets/images", img);
        if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

console.log("🎉 Build 完成，所有資源已移動並修正！");