# 🎯 UXShari 產品系統資料結構

## Firestore Collections

### `products/{productId}`
數位產品主資料表

```json
{
  "id": "product_001",
  "type": "tool|course|challenge|resource",
  "title": "UX 線框圖模板包",
  "description": "包含 20+ 常用線框圖模板，支援 Figma / Sketch",
  "price": 9,
  "currency": "USD",
  "stripeProductId": "prod_xxx",
  "stripePriceId": "price_xxx",
  "coverImage": "https://...",
  "category": "wireframe|persona|flowchart|pitch-deck|video|ebook",
  "tags": ["beginner", "template", "figma"],
  "isActive": true,
  "isFeatured": false,
  "downloadUrl": "https://...",
  "contentUrl": "https://...",
  "duration": 120,
  "level": "beginner|intermediate|advanced",
  "totalUnits": 10,
  "previewAvailable": true,
  "freeUnits": 1,
  "creditsReward": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### 欄位說明
- **type**: 產品類型
  - `tool`: 工具/模板/資源包
  - `course`: 影片課程
  - `challenge`: 挑戰包
  - `resource`: 文檔/PDF/連結集
- **price**: 單次購買價格（USD）
- **category**: 細分類別，用於篩選和推薦
- **downloadUrl**: 工具/資源直接下載連結
- **contentUrl**: 課程/挑戰內容頁面
- **totalUnits**: 課程總單元數
- **freeUnits**: 免費試看單元數
- **creditsReward**: 完成後獎勵點數

---

### `users_by_email/{email}`
使用者資料結構（擴充）

```json
{
  "email": "user@example.com",
  "name": "使用者名稱",
  "credits": 10,
  "isPaid": false,
  "payments": [...],
  
  // 🆕 新增：已購買產品
  "purchasedProducts": [
    {
      "productId": "product_001",
      "productType": "course",
      "purchaseDate": "2024-01-01T00:00:00Z",
      "stripePaymentId": "pi_xxx",
      
      // 課程進度
      "progress": {
        "currentUnit": 3,
        "totalUnits": 10,
        "completedUnits": [1, 2, 3],
        "lastAccessedAt": "2024-01-02T00:00:00Z",
        "isCompleted": false,
        "completedAt": null
      }
    },
    {
      "productId": "product_002",
      "productType": "tool",
      "purchaseDate": "2024-01-01T00:00:00Z",
      "unlocked": true
    }
  ],
  
  // 🆕 挑戰紀錄
  "challenges": [
    {
      "challengeId": "challenge_001",
      "startDate": "2024-01-01T00:00:00Z",
      "currentDay": 3,
      "totalDays": 7,
      "completedTasks": [1, 2],
      "isCompleted": false,
      "badges": ["day3", "consistency"]
    }
  ],
  
  // 🆕 成就徽章
  "badges": ["first_purchase", "course_complete", "7day_streak"],
  
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLoginAt": "2024-01-02T00:00:00Z"
}
```

---

## 產品類型定義

### 🧰 1. 工具（Tool）
**特性：**
- 單次購買即永久解鎖
- 提供下載連結或線上存取
- 可包含多個檔案（ZIP）

**範例：**
- UX 線框圖模板包
- Persona 工作表
- User Flow 圖示庫
- Pitch Deck 模板

---

### 📚 2. 課程（Course）
**特性：**
- 分單元結構（units）
- 追蹤學習進度
- 免費試看前 N 單元
- 完成後獎勵點數

**範例：**
- UX 研究入門（10 單元）
- Figma 進階技巧（8 單元）
- 使用者測試實戰（12 單元）

---

### 🎯 3. 挑戰包（Challenge）
**特性：**
- 連續 N 天任務
- 每日打卡機制
- 完成獲得徽章
- 可贈送點數或折扣券

**範例：**
- 7 天 UX 速成挑戰
- 30 天 UI 設計練習
- 21 天用戶研究習慣

---

### 📦 4. 資源庫（Resource）
**特性：**
- 文檔/PDF/連結集合
- 可單獨販售或作為套餐
- 支援外部連結

**範例：**
- UX 工具推薦清單
- 設計系統案例研究
- Figma 插件精選包

---

## Stripe Metadata 整合

創建 Stripe Product 時需包含：

```javascript
metadata: {
  productId: "product_001",
  productType: "course",
  category: "video"
}
```

Checkout Session metadata：

```javascript
metadata: {
  productId: "product_001",
  productType: "course",
  userEmail: "user@example.com"
}
```

---

## API Endpoints

### 產品管理（Admin）
```
GET    /api/products?type=tool&active=true
POST   /api/products?admin_key=xxx
PATCH  /api/products/{id}?admin_key=xxx
DELETE /api/products/{id}?admin_key=xxx
```

### 使用者購買
```
POST   /api/checkout/create-product-session
        Body: { productId, userEmail }

GET    /api/user/purchased-products?email=xxx
```

### 進度更新
```
PATCH  /api/user/progress
        Body: { email, productId, currentUnit, completedUnits }
```

---

## 轉換策略整合

### 儀表板顯示邏輯
```javascript
// 推薦產品算法
function getRecommendedProducts(user) {
  // 1. 新用戶 → 推薦入門工具 + 第一堂課
  // 2. 已購買課程 → 推薦相關工具
  // 3. 完成挑戰 → 推薦進階課程
  // 4. 高活躍度 → 推薦資源包組合
}

// 獎勵機制
function handleCourseCompletion(userId, courseId) {
  // 1. 獎勵 1 點預約額度
  // 2. 解鎖成就徽章
  // 3. 推薦下一階段課程（85折）
}
```

---

## 未來擴充

- [ ] 訂閱制產品（monthly/yearly）
- [ ] 產品組合包（bundle）
- [ ] 限時折扣（coupon codes）
- [ ] 推薦分潤機制（affiliate）
- [ ] 社群學習（collaborative challenges）
