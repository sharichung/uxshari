# 📅 Calendly Webhook 設定指南

## 步驟 1: 登入 Calendly
前往 [Calendly Integrations](https://calendly.com/integrations/webhooks)

## 步驟 2: 建立新 Webhook
點擊 **Add Webhook** 或 **Create Webhook**

## 步驟 3: 設定 Webhook URL
```
https://uxshari-workers.uxshari.workers.dev/api/calendly-webhook
```

## 步驟 4: 選擇事件類型
選擇 **invitee.created** (當有人完成預約時觸發)

## 步驟 5: (可選) 設定簽名密鑰
如果 Calendly 提供簽名密鑰，執行:
```bash
cd uxshari-workers
echo "YOUR_SIGNING_KEY" | npx wrangler secret put CALENDLY_SIGNING_KEY
```

## 步驟 6: 儲存並啟用
點擊 **Save** 並確保 webhook 狀態為 **Active**

## 測試流程
1. 訪問 https://calendly.com/sharichungdesign/30min
2. 使用測試 email 完成預約
3. 檢查 Firestore `users_by_email/{base64(email)}`:
   - `credits` 應該減少 1
   - `bookings` 陣列應該新增預約記錄

## 檢查 Webhook 狀態
```bash
curl https://uxshari-workers.uxshari.workers.dev/health
```

## 除錯
如果 webhook 失敗，檢查 Worker 日誌:
```bash
cd uxshari-workers
npx wrangler tail --format pretty
```
