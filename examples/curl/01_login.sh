#!/usr/bin/env bash
set -euo pipefail
API=${API:-http://localhost:18080}
EMAIL=${EMAIL:-test@example.com}
PASSWORD=${PASSWORD:-password123}

curl -sS "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  > /tmp/nuvonode_login.json

python - <<'PY' > /tmp/nuvonode_jwt.txt
import json
print(json.load(open('/tmp/nuvonode_login.json'))['access_token'])
PY

echo "JWT saved to /tmp/nuvonode_jwt.txt"
