#!/usr/bin/env bash
set -euo pipefail
API=${API:-http://localhost:8080}
EMAIL=${EMAIL:-test@example.com}
PASSWORD=${PASSWORD:-password123}

TOKEN=$(curl -sS "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r .access_token)

echo "$TOKEN" > /tmp/nuvonode_jwt.txt
echo "JWT saved to /tmp/nuvonode_jwt.txt"
