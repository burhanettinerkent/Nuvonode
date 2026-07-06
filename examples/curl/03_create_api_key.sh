#!/usr/bin/env bash
set -euo pipefail
API=${API:-http://localhost:8080}
JWT=$(cat /tmp/nuvonode_jwt.txt)
PROJECT_ID=$(cat /tmp/nuvonode_project_id.txt)

KEY=$(curl -sS "$API/api/projects/$PROJECT_ID/api-keys" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Local Dev Key"}' | tee /tmp/nuvonode_api_key_response.json | jq -r .plaintext_key)

echo "$KEY" > /tmp/nuvonode_api_key.txt
echo "API key saved to /tmp/nuvonode_api_key.txt"
