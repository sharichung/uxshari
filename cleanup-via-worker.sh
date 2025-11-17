#!/bin/bash
# Direct Firestore REST API cleanup for test payments
# Usage: ./cleanup-via-curl.sh sharichungdesign@gmail.com

EMAIL="$1"
if [ -z "$EMAIL" ]; then
  echo "Usage: $0 <email>"
  exit 1
fi

WORKER_URL="https://uxshari-workers.uxshari.workers.dev"

echo "🗑️  Cleaning up test payment records for: $EMAIL"
echo ""

curl -s "${WORKER_URL}/api/cleanup-test-payments?email=${EMAIL}" | jq '.'

echo ""
echo "✅ Done! Refresh your dashboard to see the updated payment records."
