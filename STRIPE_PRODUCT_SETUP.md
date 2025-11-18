# 🛍️ Stripe 產品設定指南

## 問題診斷
錯誤訊息：`No such price: 'price_wireframe_zh'`

**原因**：Stripe Price ID 必須是從 Stripe Dashboard 實際建立的 ID，格式為 `price_` 開頭 + 隨機字串（例如：`price_1QKm8xHNWqZ9vYjJ2L3k4M5n`）

---

## ✅ 正確設定流程

### 步驟 1：在 Stripe Dashboard 建立產品

1. 登入 [Stripe Dashboard](https://dashboard.stripe.com)
2. 點擊 **Products** → **Add product**
3. 填寫產品資訊：
   - **Name**: `UX 線框圖模板包`
   - **Description**: `包含 20+ 常用線框圖模板，支援 Figma / Sketch`
   - **Pricing model**: `Standard pricing`
   - **Price**: `9.00 USD`
   - **Billing period**: `One time` (一次性購買)

4. 點擊 **Save product**

5. **複製 IDs**：
   - Product ID: `prod_xxxxx`（在產品頁面上方）
   - Price ID: `price_xxxxx`（在 Pricing 區塊）

---

### 步驟 2：在 Admin 介面新增產品

1. 訪問 `https://uxshari.com/admin.html`
2. 輸入 ADMIN_KEY 驗證
3. 填寫表單：
   - **產品類型**: `🧰 工具 (Tool)`
   - **產品名稱**: `UX 線框圖模板包`
   - **產品描述**: `包含 20+ 常用線框圖模板，支援 Figma / Sketch`
   - **價格**: `9.00`
   - **Stripe Product ID**: 貼上從 Stripe 複製的 `prod_xxxxx`
   - **Stripe Price ID**: 貼上從 Stripe 複製的 `price_xxxxx` ⚠️ **必填！**
   - **封面圖 URL**: 上傳圖片後填寫 URL
   - **下載連結**: Figma/Google Drive 分享連結

4. 點擊 **建立產品**

---

## 🧪 測試產品範例

為了方便測試，建議先建立一個 **$1 測試產品**：

### Stripe 設定
```
Name: 測試工具包
Price: $1.00 USD
Type: One time
```

### Admin 表單
```
產品類型: tool
產品名稱: 測試工具包
描述: 用於測試購買流程
價格: 1.00
Stripe Price ID: price_從Stripe複製過來的ID
下載連結: https://example.com/test-download
```

### 測試購買
使用 Stripe 測試卡：
```
卡號: 4242 4242 4242 4242
有效期限: 任意未來日期
CVC: 任意 3 碼
```

---

## 🔍 檢查現有產品

執行以下命令查看已建立的產品：

\`\`\`bash
curl "https://uxshari-workers.uxshari.workers.dev/api/products"
\`\`\`

如果看到 `stripePriceId: "price_wireframe_zh"`，需要：

1. **刪除此產品**（從 admin.html）
2. **在 Stripe 建立真實產品**
3. **重新在 admin.html 新增**（使用正確的 Price ID）

---

## 📝 Stripe Price ID 格式規則

✅ **正確格式**：
- `price_1QKm8xHNWqZ9vYjJ2L3k4M5n`
- `price_1234567890abcdefghij`

❌ **錯誤格式**：
- `price_wireframe_zh`（自訂名稱）
- `prod_xxxxx`（這是 Product ID，不是 Price ID）
- `9.00`（這是價格，不是 ID）

---

## 🚨 常見錯誤

### 錯誤 1: 使用 Product ID 當作 Price ID
```
stripePriceId: "prod_xxxxx"  ❌ 錯誤
stripePriceId: "price_xxxxx" ✅ 正確
```

### 錯誤 2: 自訂 Price ID
Stripe 不支援自訂 Price ID，必須由系統生成。

### 錯誤 3: 忘記複製完整 ID
確保複製完整字串，包含 `price_` 前綴。

---

## 🔄 修正現有錯誤產品

如果已經建立了錯誤的產品：

\`\`\`bash
# 1. 刪除錯誤產品
curl -X DELETE "https://uxshari-workers.uxshari.workers.dev/api/products/錯誤的產品ID?admin_key=你的ADMIN_KEY"

# 2. 在 Stripe 建立產品並取得正確 Price ID

# 3. 重新在 admin.html 建立產品
\`\`\`

---

## 💡 最佳實務

1. **先在 Stripe 建立** → 再在 admin.html 新增
2. **測試模式**：先用 $1 測試產品驗證流程
3. **記錄 IDs**：在筆記中記錄 Product/Price ID 對應關係
4. **檢查 webhook**：確認 Stripe webhook 已設定且運作正常

---

## 🎨 封面圖最佳實務

### 推薦規格
```
尺寸: 1200×800px (3:2 比例)
格式: WebP > JPG > PNG
大小: <200KB (建議壓縮)
解析度: 72 DPI (網頁用)
```

### 響應式設計考量
- **Desktop**: 顯示為 400×267px (3 欄網格)
- **Tablet**: 顯示為 350×233px (2 欄網格)  
- **Mobile**: 顯示為 100%×200px (1 欄)

### 設計建議
1. **主體居中**：重要元素放在圖片中央 60% 區域
2. **避免文字**：圖片上不要有小字（會糊掉）
3. **高對比度**：確保在小尺寸下清晰可見
4. **品牌一致**：使用相同的色調/風格

### 免費圖庫資源
- [Unsplash](https://unsplash.com) - 高品質免費圖片
- [Pexels](https://www.pexels.com) - 商用免費素材
- [Pixabay](https://pixabay.com) - 多樣化選擇

### URL 範例
```
https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1200&h=800&fit=crop

參數說明：
- w=1200: 寬度 1200px
- h=800: 高度 800px  
- fit=crop: 裁切填滿
```

### 圖片優化工具
- [TinyPNG](https://tinypng.com) - 壓縮 PNG/JPG
- [Squoosh](https://squoosh.app) - 轉換為 WebP
- [CloudConvert](https://cloudconvert.com) - 批次處理

### Fallback 機制
如果圖片載入失敗，系統會自動顯示預設漸層背景：
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

---

## 📞 需要協助？

如果遇到問題：

1. 檢查 Stripe Dashboard → Products 是否成功建立
2. 確認 Price ID 格式正確（`price_` 開頭）
3. 查看 Worker logs：`npx wrangler tail`
4. 測試 API：`curl "https://uxshari-workers.uxshari.workers.dev/api/products"`
