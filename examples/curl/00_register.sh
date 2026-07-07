#!/usr/bin/env bash
set -euo pipefail
API=${API:-http://localhost:18080}
EMAIL=${EMAIL:-test@example.com}
PASSWORD=${PASSWORD:-password123}

curl -sS "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"display_name\":\"Test User\"}" | tee /tmp/nuvonode_register.json

echo "\nToken saved to /tmp/nuvonode_register.json"
