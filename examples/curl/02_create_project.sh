#!/usr/bin/env bash
set -euo pipefail
API=${API:-http://localhost:18080}
JWT=$(cat /tmp/nuvonode_jwt.txt)

curl -sS "$API/api/projects" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Local Test Project","monthly_credit_limit":null}' \
  > /tmp/nuvonode_project.json

python - <<'PY' > /tmp/nuvonode_project_id.txt
import json
print(json.load(open('/tmp/nuvonode_project.json'))['project']['id'])
PY

printf 'Project: '
cat /tmp/nuvonode_project_id.txt
