#!/usr/bin/env bash
set -euo pipefail
API=${API:-http://localhost:8080}
JWT=$(cat /tmp/nuvonode_jwt.txt)

PROJECT_ID=$(curl -sS "$API/api/projects" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Local Test Project","monthly_credit_limit":null}' | tee /tmp/nuvonode_project.json | jq -r .project.id)

echo "$PROJECT_ID" > /tmp/nuvonode_project_id.txt
echo "Project: $PROJECT_ID"
