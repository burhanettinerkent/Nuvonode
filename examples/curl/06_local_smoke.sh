#!/usr/bin/env bash
set -euo pipefail

API=${API:-http://localhost:18080}
EMAIL=${EMAIL:-smoke-$(date +%s)@example.com}
PASSWORD=${PASSWORD:-password123}
PROVIDER_CONFIG=${PROVIDER_CONFIG:-/tmp/nuvonode-provider-smoke.yaml}
RUN_PROVIDER_DOCTOR=${RUN_PROVIDER_DOCTOR:-0}
RUN_CHAT=${RUN_CHAT:-0}

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

need() {
  command -v "$1" >/dev/null || { echo "missing command: $1" >&2; exit 1; }
}

json_get() {
  python -c "import json,sys; data=json.load(open(sys.argv[1])); print(data${2})" "$1"
}

need curl
need python
need go

curl -fsS "$API/health" >/tmp/nuvonode_health.json

curl -fsS "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"display_name\":\"Smoke User\"}" \
  >/tmp/nuvonode_register.json

curl -fsS "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  >/tmp/nuvonode_login.json
JWT=$(json_get /tmp/nuvonode_login.json "['access_token']")
echo "$JWT" >/tmp/nuvonode_jwt.txt

curl -fsS "$API/api/projects" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Project","monthly_credit_limit":null}' \
  >/tmp/nuvonode_project.json
PROJECT_ID=$(json_get /tmp/nuvonode_project.json "['project']['id']")
echo "$PROJECT_ID" >/tmp/nuvonode_project_id.txt

curl -fsS "$API/api/projects/$PROJECT_ID/api-keys" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke API Key"}' \
  >/tmp/nuvonode_api_key_response.json
API_KEY=$(json_get /tmp/nuvonode_api_key_response.json "['plaintext_key']")
echo "$API_KEY" >/tmp/nuvonode_api_key.txt

curl -fsS "$API/api/providers" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Provider","region_hint":"local","allow_auto_model_pull":false}' \
  >/tmp/nuvonode_provider_response.json
PROVIDER_TOKEN=$(json_get /tmp/nuvonode_provider_response.json "['plaintext_token']")
echo "$PROVIDER_TOKEN" >/tmp/nuvonode_provider_token.txt

(cd "$ROOT/apps/provider-node" && go run ./cmd/provider-node init --server "$API" --token "$PROVIDER_TOKEN" --name "Smoke Provider" --config "$PROVIDER_CONFIG")

curl -fsS "$API/api/wallet" -H "Authorization: Bearer $JWT" >/tmp/nuvonode_wallet.json
curl -fsS "$API/api/models" -H "Authorization: Bearer $JWT" >/tmp/nuvonode_models.json

if [ "$RUN_PROVIDER_DOCTOR" = "1" ]; then
  (cd "$ROOT/apps/provider-node" && go run ./cmd/provider-node doctor --config "$PROVIDER_CONFIG")
fi

if [ "$RUN_CHAT" = "1" ]; then
  curl -fsS "$API/v1/chat/completions" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model":"qwen-7b-instruct","messages":[{"role":"user","content":"Türkçe tek cümleyle kendini tanıt."}],"max_tokens":128,"temperature":0.7,"stream":false}' \
    | python -m json.tool
fi

cat <<OUT
Smoke setup complete.

API: $API
Email: $EMAIL
Password: $PASSWORD
Project: $PROJECT_ID
Provider config: $PROVIDER_CONFIG

Saved:
/tmp/nuvonode_jwt.txt
/tmp/nuvonode_api_key.txt
/tmp/nuvonode_provider_token.txt

To test real provider routing, start Ollama with a seeded runtime model, then run:
cd "$ROOT/apps/provider-node" && go run ./cmd/provider-node serve --config "$PROVIDER_CONFIG"

In another terminal, after provider is online, call chat manually with examples/curl/05_chat_completion.sh or rerun this script with RUN_CHAT=1.
OUT
