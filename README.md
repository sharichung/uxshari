# UXShari 學習平台

一個完整的 UX/UI 教育平台，整合付費預約、課程管理與會員系統。

## 🎯 核心功能

### 付款與預約系統
- **Stripe 整合**：支援 Test/Live Mode，checkout session + webhook 自動增加點數
- **Calendly 單次連結**：每次預約生成 10 分鐘過期的單次使用連結
- **自動退款機制**：Cloudflare Cron 每 15 分鐘清理過期未完成的預約並退回點數
- **Credits 系統**：optimistic deduction（點擊預約立即扣點），未完成自動退款

### 會員管理
- **Firebase Auth**：email/password 登入
- **Firestore**：users_by_email, pending_bookings, bookings_by_id, events_by_id, issued_links
- **即時更新**：Dashboard 使用 onSnapshot 監聽資料變化

### 前端體驗
- **Dashboard**：顯示剩餘點數、付款紀錄、預約紀錄
- **智能提示**：預約時顯示黃色倒數警告框（10 分鐘內完成）
- **容錯顯示**：支援多種時間戳與金額格式，避免 Invalid Date / undefined

## 📁 專案結構

```
uxshari/
├── docs/                          # GitHub Pages 靜態站（build 輸出）
│   ├── dashboard.html             # 會員儀表板
│   ├── login.html                 # 登入頁
│   ├── payment.html               # 付款頁
│   ├── success.html               # 付款成功頁
│   └── assets/                    # CSS/JS/Images
├── src/
│   └── views/                     # 原始 HTML 模板
│       ├── dashboard.html
│       ├── dashboard-optimized.html
│       └── components/            # Navbar/Footer 元件
├── uxshari-workers/               # Cloudflare Worker (後端 API)
│   ├── src/
│   │   └── index.js              # 主要 API 端點
│   ├── wrangler.toml             # Worker 配置 + Cron
│   └── package.json
├── build.js                       # 靜態站建構腳本
└── README.md
```

## 🚀 部署流程

### 前端（GitHub Pages）
```bash
# 1. 修改 src/views/*.html
# 2. 執行建構
npm run build

# 3. 提交並推送
git add -A
git commit -m "feat: update dashboard"
git push origin main
```

### 後端（Cloudflare Worker）
```bash
cd uxshari-workers

# 1. 配置環境變數（首次）
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put CALENDLY_PAT
wrangler secret put GOOGLE_PRIVATE_KEY
wrangler secret put GCP_SERVICE_ACCOUNT_EMAIL

# 2. 部署
wrangler deploy
```

### Firestore 規則
```bash
firebase deploy --only firestore:rules
```

## 🔧 環境設定

### Worker Secrets（Cloudflare）
- `STRIPE_SECRET_KEY`：Stripe API key (test/live)
- `STRIPE_WEBHOOK_SECRET`：Stripe webhook endpoint secret
- `CALENDLY_PAT`：Calendly Personal Access Token
- `CALENDLY_EVENT_TYPE_50MIN`：Calendly event type URI
- `CALENDLY_SIGNING_KEY`：Calendly webhook signing key（可選）
- `GOOGLE_PRIVATE_KEY`：GCP Service Account private key (PEM format)
- `GCP_SERVICE_ACCOUNT_EMAIL`：GCP Service Account email
- `GCP_PROJECT_ID`：Firebase project ID
- `ADMIN_KEY`：管理端點驗證金鑰（**已設定，請妥善保管**）
  - **當前金鑰**：`cd36c807ff6b89a47ce9877a3a317e5ecf2ce83ed31c8e7aa3ed3d6117bff6da`

### Firebase Config（前端）
在 src/views/*.html 中配置：
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "uxshari-670fd.firebaseapp.com",
  projectId: "uxshari-670fd",
  appId: "..."
};
```

## 📡 API 端點

### 生產端點
- `POST /api/stripe-webhook`：Stripe checkout.session.completed webhook
- `POST /api/calendly-webhook`：Calendly invitee.created/canceled webhook（✅ 已配置）
- `GET /api/create-scheduling-link?email=...`：生成 Calendly 單次連結
- `GET /api/checkout-redirect?email=...&origin=...`：Stripe checkout redirect
- `GET /health`：健康檢查

### 測試/維護端點（需 admin_key）
所有以下端點必須帶 `?admin_key=YOUR_ADMIN_KEY` 參數：
- `GET /api/add-test-credits?email=...&amount=1-10&admin_key=...`：測試加點
- `GET /api/reset-credits?email=...&amount=0&admin_key=...`：重設點數
- `GET /api/cleanup-expired-bookings?test=true&admin_key=...`：立即清理過期預約
- `GET /api/cleanup-test-payments?email=...&admin_key=...`：清理無金額的測試付款紀錄
- `GET /api/confirm-booking?booking_id=...&admin_key=...`：手動確認預約（臨時方案）
- `GET /api/cron-status?admin_key=...`：查詢 Cron 最後執行狀態

### 管理端點（需 admin_key）
- `GET /api/calendly-webhook-subscribe?admin_key=...`：建立 Calendly webhook 訂閱
- `GET /api/debug-pending-bookings?email=...`：列出待處理預約

### Cron Jobs
- 每 15 分鐘：自動清理過期預約並退款（wrangler.toml 配置）
- 執行後寫入狀態到 Firestore：`system/cron_cleanup`

## 🗄️ Firestore 資料結構

### users_by_email/{base64url(email)}
```javascript
{
  email: "user@example.com",
  credits: 1,                    // 剩餘點數
  isPaid: true,
  payments: [                    // 付款紀錄
    {
      amount: 33,
      currency: "usd",
      createdAt: "2025-11-17T...",
      sessionId: "cs_...",
      receiptUrl: "https://..."
    }
  ],
  bookings: [                    // 預約紀錄
    {
      id: "booking_123",
      status: "scheduled",
      confirmedAt: "2025-11-17T...",
      eventUri: "https://..."
    }
  ]
}
```

### pending_bookings/{bookingId}
```javascript
{
  email: "user@example.com",
  linkToken: "abc123",
  status: "pending",             // pending | confirmed | expired
  createdAt: "2025-11-17T...",
  expiresAt: "2025-11-17T..."   // createdAt + 10 分鐘
}
```

## ✅ UAT 驗證結果

### 場景 1：完整付款流程
- ✅ Stripe Test Mode checkout 成功
- ✅ Webhook 正確增加 credits
- ✅ success.html 導回 dashboard
- ✅ 付款紀錄顯示正確

### 場景 2：預約流程
- ✅ 點擊預約立即扣點（optimistic）
- ✅ 黃色警告框顯示 10 分鐘倒數
- ✅ Calendly 單次連結開啟
- ✅ 預約紀錄正確顯示

### 場景 3：自動退款
- ✅ 未完成預約自動退點
- ✅ pending_bookings 清空
- ✅ 黃色警告自動變回綠色

### 額外修正
- ✅ 修復 Invalid Date（支援多種時間戳格式）
- ✅ 修復 USD $undefined（支援多種金額欄位）
- ✅ 清理測試紀錄功能

## 🔜 待處理項目

### ✅ 已完成（上線前）
1. **Calendly Webhook 配置**
   - ✅ 已設定新的 PAT
   - ✅ Webhook 訂閱已存在並啟用
   - ✅ 支援 invitee.created / invitee.canceled 事件
   
2. **測試端點保護**
   - ✅ 所有測試/管理端點已加上 ADMIN_KEY 驗證
   - ✅ 移除重複的 cleanup 端點定義
   - ✅ requireAdminKey() 驗證機制
   
3. **監控設定**
   - ✅ Cron 執行狀態寫入 Firestore (`system/cron_cleanup`)
   - ✅ /api/cron-status 查詢端點
   - ✅ 每次 Cron 記錄 lastRunAt、refundedCount、totalPending

### 可選增強
- [ ] Slack/Email 告警通知（Cron 失敗時）
- [ ] Cloudflare Analytics Dashboard
- [ ] Stripe webhook 失敗自動重試

### 功能增強（可選）
- [ ] Dashboard 增加歷史預約時段顯示
- [ ] Email 通知（預約確認/取消）
- [ ] 批量購買折扣
- [ ] 推薦獎勵機制

## 🛠️ 開發指令

```bash
# 安裝依賴
npm install

# 本地建構前端
npm run build

# Worker 本地測試
cd uxshari-workers
wrangler dev

# Worker 部署
wrangler deploy

# Firebase 部署
firebase deploy

# 設定 Worker secrets
wrangler secret put ADMIN_KEY
wrangler secret put CALENDLY_PAT
wrangler secret put STRIPE_SECRET_KEY

# 查詢 Cron 狀態（需 admin_key）
curl "https://uxshari-workers.uxshari.workers.dev/api/cron-status?admin_key=YOUR_ADMIN_KEY"

# 清理測試資料（需 admin_key）
curl "https://uxshari-workers.uxshari.workers.dev/api/cleanup-test-payments?email=test@example.com&admin_key=YOUR_ADMIN_KEY"

# 手動觸發過期清理測試（需 admin_key）
curl "https://uxshari-workers.uxshari.workers.dev/api/cleanup-expired-bookings?test=true&admin_key=YOUR_ADMIN_KEY"
```

## 📞 聯絡資訊

- 網站：https://uxshari.com
- Worker API：https://uxshari-workers.uxshari.workers.dev
- Firebase：https://console.firebase.google.com/project/uxshari-670fd

## 📄 授權

© 2025 UXShari. All rights reserved.
