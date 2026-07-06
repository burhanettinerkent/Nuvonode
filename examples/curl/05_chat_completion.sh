#!/usr/bin/env bash
set -euo pipefail
API=${API:-http://localhost:8080}
KEY=$(cat /tmp/nuvonode_api_key.txt)

curl -sS "$API/v1/chat/completions" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model":"qwen-7b-instruct",
    "messages":[{"role":"user","content":"Türkçe tek cümleyle kendini tanıt."}],
    "max_tokens":128,
    "temperature":0.7,
    "stream":false
  }' | jq .
