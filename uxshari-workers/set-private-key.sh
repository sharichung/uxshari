#!/bin/bash

# 正確設定 GOOGLE_PRIVATE_KEY 的腳本
# 使用方式: ./set-private-key.sh <path-to-firebase-service-account.json>

if [ -z "$1" ]; then
  echo "Usage: ./set-private-key.sh <path-to-firebase-service-account.json>"
  exit 1
fi

# 從 JSON 文件提取 private_key，保持 \n 轉義
PRIVATE_KEY=$(jq -r '.private_key' "$1")

# 直接設定 (保留 \n 轉義)
echo "$PRIVATE_KEY" | npx wrangler secret put GOOGLE_PRIVATE_KEY

echo "✅ GOOGLE_PRIVATE_KEY set successfully"
