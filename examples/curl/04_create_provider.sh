#!/usr/bin/env bash
set -euo pipefail
API=${API:-http://localhost:8080}
JWT=$(cat /tmp/nuvonode_jwt.txt)

TOKEN=$(curl -sS "$API/api/providers" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Local Provider","region_hint":"TR","allow_auto_model_pull":false}' | tee /tmp/nuvonode_provider_response.json | jq -r .plaintext_provider_token)

echo "$TOKEN" > /tmp/nuvonode_provider_token.txt
echo "Provider token saved to /tmp/nuvonode_provider_token.txt"
echo "Run: nuvonode-provider init --server $API --token $TOKEN --name 'Local Provider'"
