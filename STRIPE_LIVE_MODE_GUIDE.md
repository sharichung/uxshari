# 🔴 Stripe Live Mode 切換指南

## ⚠️ 切換前檢查清單
- [ ] 已在測試模式完整測試付款流程
- [ ] Dashboard 正確顯示 credits 和付款紀錄
- [ ] Calendly webhook 已設定並測試
- [ ] Firestore 資料結構驗證無誤

---

## 步驟 1: 取得 Live Webhook Secret

### 在 Stripe Dashboard:
1. 切換到 **Live Mode** (右上角)
2. 前往 [Developers → Webhooks](https://dashboard.stripe.com/webhooks)
3. 點擊 **Add endpoint**
4. 輸入 URL:
   ```
   https://uxshari-workers.uxshari.workers.dev/api/stripe-webhook
   ```
5. 選擇事件:
   - `checkout.session.completed`
   - (可選) `payment_intent.succeeded`
6. 點擊 **Add endpoint**
7. 複製 **Signing secret** (以 `whsec_` 開頭)

---

## 步驟 2: 更新 Worker Secrets

```bash
cd uxshari-workers

# 設定 Live Webhook Secret
echo "whsec_YOUR_LIVE_SECRET" | npx wrangler secret put STRIPE_WEBHOOK_SECRET

# 設定 Live Secret Key (如需展開 Session 資料)
echo "sk_live_YOUR_SECRET_KEY" | npx wrangler secret put STRIPE_SECRET_KEY
```

---

## 步驟 3: 更新 Dashboard 付款連結

### 修改 `src/views/dashboard-optimized.html` 和 `src/views/dashboard.html`:

找到這行:
```javascript
const testMode = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');
const baseUrl = testMode 
  ? 'https://buy.stripe.com/test_00wcN5czwbXRb4Xfjh3ks00'
  : 'https://buy.stripe.com/00gcN5czwbXRb4Xfjh';  // ← 更新為你的 Live Payment Link
```

### 取得 Live Payment Link:
1. 前往 [Stripe Dashboard → Payment Links](https://dashboard.stripe.com/payment-links)
2. 建立新的 Payment Link (或使用現有的)
3. 設定金額: **$33 USD**
4. 複製 Payment Link URL
5. 更新上方程式碼中的 URL

---

## 步驟 4: 重新部署

```bash
# 更新 Dashboard
cp src/views/dashboard-optimized.html src/views/dashboard.html
node build.js

# Commit 並推送
git add -A
git commit -m "🔴 切換到 Stripe Live Mode"
git push origin main
```

---

## 步驟 5: 測試 Live Mode

### 使用真實付款測試:
1. 訪問 https://uxshari.com/dashboard.html
2. 用真實 email 登入
3. 點擊「購買 1 次輔導」
4. 使用真實信用卡完成付款 (會實際扣款)
5. 檢查 Dashboard 是否即時更新 credits

### 檢查 Firestore:
前往 [Firebase Console → Firestore](https://console.firebase.google.com/project/uxshari-670fd/firestore)
- 查看 `users_by_email/{base64(email)}` 文件
- 確認 `credits: 1`, `isPaid: true`, `payments: [...]`

---

## 📊 監控與除錯

### 查看 Worker 即時日誌:
```bash
cd uxshari-workers
npx wrangler tail --format pretty
```

### 查看 Stripe Webhook 日誌:
前往 [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
- 點擊你的 endpoint
- 查看 **Recent events** 和 **Response** 狀態

---

## 🔙 切回測試模式

如需切回測試模式:
```bash
cd uxshari-workers
echo "whsec_031f247238454a2ddfd957704a10ec330bd386069bec1ebabadf3433dc5d9bde" | npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

---

## 常見問題

### Q: Webhook 返回 500 錯誤
**A:** 檢查 `wrangler tail` 日誌,確認:
- GCP_PROJECT_ID 正確
- GOOGLE_PRIVATE_KEY 格式無誤
- Firestore 權限設定正確

### Q: Dashboard 沒有即時更新
**A:** 檢查:
- Firebase Authentication 是否登入
- Email 是否與付款 email 一致
- Browser Console 是否有 Firestore 錯誤

### Q: Credits 沒有增加
**A:** 確認:
- Stripe webhook 成功送達 (200 OK)
- Firestore 文件已建立
- Email base64url 編碼正確
