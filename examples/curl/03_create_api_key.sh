#!/usr/bin/env bash
set -euo pipefail
API=${API:-http://localhost:18080}
JWT=$(cat /tmp/nuvonode_jwt.txt)
PROJECT_ID=$(cat /tmp/nuvonode_project_id.txt)

curl -sS "$API/api/projects/$PROJECT_ID/api-keys" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Local Dev Key"}' \
  > /tmp/nuvonode_api_key_response.json

python - <<'PY' > /tmp/nuvonode_api_key.txt
import json
print(json.load(open('/tmp/nuvonode_api_key_response.json'))['plaintext_key'])
PY

echo "API key saved to /tmp/nuvonode_api_key.txt"
