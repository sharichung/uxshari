# Stripe Live Mode 切換與問題排查

## 問題 1：購買按鈕仍導向 Test Mode

### 檢查當前模式
```bash
cd uxshari-workers

# 檢查當前使用的 STRIPE_SECRET_KEY
# Test mode key: sk_test_...
# Live mode key: sk_live_...
```

### 切換到 Live Mode
1. **取得 Stripe Live Mode Secret Key**
   - 登入 Stripe Dashboard: https://dashboard.stripe.com
   - 確認右上角切換到 **Live Mode**（不是 Test Mode）
   - 前往 Developers → API keys
   - 複製 **Secret key**（sk_live_...）

2. **更新 Worker Secret**
   ```bash
   cd uxshari-workers
   npx wrangler secret put STRIPE_SECRET_KEY
   # 貼上 sk_live_... 開頭的 key
   ```

3. **更新 Webhook Secret（Live Mode）**
   ```bash
   # 在 Stripe Dashboard (Live Mode) → Developers → Webhooks
   # 找到你的 webhook endpoint，複製 Signing secret
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

4. **重新部署**
   ```bash
   npx wrangler deploy
   ```

5. **驗證**
   - 測試購買流程，檢查 Stripe Dashboard 的 Live Mode 是否有新的 payment
   - 確認收到的款項是真實的（不是測試卡）

## 問題 2：預約成功後沒出現在預約紀錄

### 可能原因與排查

#### A. Calendly Webhook 未觸發
**檢查方式：**
```bash
# 查看 Cloudflare Worker logs
cd uxshari-workers
npx wrangler tail
```
然後進行一次預約，看是否有 "📨 Calendly webhook received" 日誌。

**如果沒有日誌：**
1. 確認 Calendly webhook 訂閱是否存在
   ```bash
   curl "https://uxshari-workers.uxshari.workers.dev/api/calendly-webhook-subscribe?admin_key=YOUR_ADMIN_KEY"
   ```
   應該回傳 "Already Exists" 或訂閱成功

2. 檢查 Calendly Dashboard
   - 登入 Calendly
   - Account → Integrations → Webhooks
   - 確認有訂閱指向 `https://uxshari-workers.uxshari.workers.dev/api/calendly-webhook`
   - 檢查 Events: invitee.created, invitee.canceled

#### B. Webhook 收到但處理失敗
**檢查方式：**
在 `wrangler tail` 中查看是否有錯誤訊息，例如：
- "❌ No tracking token in Calendly webhook"
- "❌ Failed to find user"
- "❌ Commit failed"

**可能原因：**
1. **缺少 tracking token（UTM 參數）**
   - 預約連結必須包含 `utm_campaign=<linkToken>`
   - 如果從舊的預約連結（沒有 UTM）預約，系統無法關聯使用者

2. **Email 不匹配**
   - Calendly 預約的 email 必須和購買時的 email 一致
   - 檢查 Firestore 中 `users_by_email` collection 是否有對應的文件

#### C. Dashboard 沒有即時更新
**檢查方式：**
1. 打開瀏覽器開發者工具 Console
2. 重新整理 dashboard.html
3. 查看是否有錯誤訊息

**手動驗證 Firestore 資料：**
1. 前往 Firebase Console: https://console.firebase.google.com/project/uxshari-670fd
2. Firestore Database
3. 找到你的 email 文件（users_by_email collection）
4. 檢查 `bookings` 陣列是否有新資料

### 手動測試 Webhook

如果 Calendly webhook 沒有自動觸發，可以使用臨時的手動確認端點：

```bash
# 1. 先查詢你的 pending booking ID
curl "https://uxshari-workers.uxshari.workers.dev/api/debug-pending-bookings?email=YOUR_EMAIL"

# 2. 手動確認預約（需要 admin_key）
curl "https://uxshari-workers.uxshari.workers.dev/api/confirm-booking?booking_id=BOOKING_ID&admin_key=YOUR_ADMIN_KEY"
```

## 完整測試流程

1. **確認 Live Mode**
   - Stripe key 是 `sk_live_...` 開頭
   - Webhook secret 來自 Live Mode

2. **清空瀏覽器緩存**
   ```
   開發者工具 → Application → Clear site data
   ```

3. **完整流程測試**
   - 登入會員
   - 點擊「購買 1 次輔導（$33）」
   - 使用真實信用卡（或 Stripe Live Mode 測試卡）
   - 付款成功後應該導回 success.html
   - 回到 dashboard 確認 credits +1
   - 點擊「立即預約」
   - 在 Calendly 完成預約（10分鐘內）
   - 回到 dashboard 確認預約紀錄出現

4. **監控日誌**
   ```bash
   cd uxshari-workers
   npx wrangler tail
   ```

## 常見錯誤與解決

### "hmacSha256Hex is not defined"
✅ 已修復（最新部署已包含此函數）

### "Unauthorized: invalid or missing admin_key"
確認使用正確的 ADMIN_KEY：
```
cd36c807ff6b89a47ce9877a3a317e5ecf2ce83ed31c8e7aa3ed3d6117bff6da
```

### Calendly webhook "Hook with this url already exists"
正常！表示 webhook 已經訂閱，不需要重複建立。

### 預約顯示黃色警告但沒有出現在紀錄
- 等待 10 分鐘看是否自動退點
- 或手動觸發清理：
  ```bash
  curl "https://uxshari-workers.uxshari.workers.dev/api/cleanup-expired-bookings?test=true&admin_key=YOUR_ADMIN_KEY"
  ```

## 需要協助？

如果以上步驟都無法解決問題，提供以下資訊：

1. Worker logs（`wrangler tail` 輸出）
2. 瀏覽器 Console 錯誤訊息
3. Firestore 中你的 email 文件截圖
4. Calendly Dashboard webhook 設定截圖
