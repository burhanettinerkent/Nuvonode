#!/usr/bin/env bash
set -euo pipefail
API=${API:-http://localhost:18080}
JWT=$(cat /tmp/nuvonode_jwt.txt)

curl -sS "$API/api/providers" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Local Provider","region_hint":"TR","allow_auto_model_pull":false}' \
  > /tmp/nuvonode_provider_response.json

python - <<'PY' > /tmp/nuvonode_provider_token.txt
import json
print(json.load(open('/tmp/nuvonode_provider_response.json'))['plaintext_token'])
PY

TOKEN=$(cat /tmp/nuvonode_provider_token.txt)
echo "Provider token saved to /tmp/nuvonode_provider_token.txt"
echo "Run: nuvonode-provider init --server $API --token $TOKEN --name 'Local Provider'"
