#!/usr/bin/env bash
set -euo pipefail

API=${API:-http://localhost:18080}
EMAIL=${EMAIL:-smoke-$(date +%s)@example.com}
PASSWORD=${PASSWORD:-password123}
PROVIDER_CONFIG=${PROVIDER_CONFIG:-/tmp/nuvonode-provider-smoke.yaml}
RUN_PROVIDER_DOCTOR=${RUN_PROVIDER_DOCTOR:-0}
RUN_PROVIDER_E2E=${RUN_PROVIDER_E2E:-0}
RUN_CHAT=${RUN_CHAT:-0}
SMOKE_MODEL=${SMOKE_MODEL:-qwen-7b-instruct}

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

need() {
  command -v "$1" >/dev/null || { echo "missing command: $1" >&2; exit 1; }
}

json_get() {
  python -c "import json,sys; data=json.load(open(sys.argv[1])); print(data${2})" "$1"
}

wait_for_provider_ad() {
  local deadline=$((SECONDS + 45))
  while [ "$SECONDS" -lt "$deadline" ]; do
    if docker exec nuvonode-postgres psql -U nuvonode -d nuvonode -At -c "select 1 from provider_model_advertisements where provider_id=(select id from providers where public_id='$1') and runtime_model_name='$SMOKE_MODEL' limit 1" | grep -q 1; then
      return 0
    fi
    sleep 1
  done
  echo "provider did not advertise $SMOKE_MODEL within 45s" >&2
  return 1
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
PROVIDER_ID=$(json_get /tmp/nuvonode_provider_response.json "['provider']['id']")
PROVIDER_TOKEN=$(json_get /tmp/nuvonode_provider_response.json "['plaintext_token']")
[[ "$PROVIDER_ID" =~ ^prv_[A-Za-z0-9_-]+$ ]] || { echo "bad provider id: $PROVIDER_ID" >&2; exit 1; }
[[ "$SMOKE_MODEL" =~ ^[A-Za-z0-9._:-]+$ ]] || { echo "bad smoke model: $SMOKE_MODEL" >&2; exit 1; }
echo "$PROVIDER_ID" >/tmp/nuvonode_provider_id.txt
echo "$PROVIDER_TOKEN" >/tmp/nuvonode_provider_token.txt

(cd "$ROOT/apps/provider-node" && go run ./cmd/provider-node init --server "$API" --token "$PROVIDER_TOKEN" --name "Smoke Provider" --config "$PROVIDER_CONFIG")

curl -fsS "$API/api/wallet" -H "Authorization: Bearer $JWT" >/tmp/nuvonode_wallet.json
curl -fsS "$API/api/models" -H "Authorization: Bearer $JWT" >/tmp/nuvonode_models.json

if [ "$RUN_PROVIDER_DOCTOR" = "1" ]; then
  (cd "$ROOT/apps/provider-node" && go run ./cmd/provider-node doctor --config "$PROVIDER_CONFIG")
fi

if [ "$RUN_PROVIDER_E2E" = "1" ]; then
  need docker
  need ollama
  curl -fsS http://localhost:11434/api/tags \
    | python -c "import json,sys; m='$SMOKE_MODEL'; names={x['name'] for x in json.load(sys.stdin)['models']}; raise SystemExit(0 if m in names or m+':latest' in names else 'missing Ollama model: '+m)"

  (cd "$ROOT/apps/provider-node" && go run ./cmd/provider-node serve --config "$PROVIDER_CONFIG") >/tmp/nuvonode_provider_serve.log 2>&1 &
  PROVIDER_PID=$!
  trap 'kill "$PROVIDER_PID" >/dev/null 2>&1 || true' EXIT

  wait_for_provider_ad "$PROVIDER_ID"
  docker exec nuvonode-postgres psql -U nuvonode -d nuvonode -v ON_ERROR_STOP=1 -c "update providers set approval_status='approved', status='active' where public_id='$PROVIDER_ID'; update provider_model_advertisements set status='approved' where provider_id=(select id from providers where public_id='$PROVIDER_ID') and runtime_model_name='$SMOKE_MODEL';" >/tmp/nuvonode_provider_e2e_approve.log

  curl -fsS "$API/v1/chat/completions" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"$SMOKE_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"Türkçe tek cümleyle kendini tanıt.\"}],\"max_tokens\":64,\"temperature\":0.2,\"stream\":false}" \
    >/tmp/nuvonode_chat_response.json
  python -m json.tool /tmp/nuvonode_chat_response.json
fi

if [ "$RUN_CHAT" = "1" ]; then
  curl -fsS "$API/v1/chat/completions" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"$SMOKE_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"Türkçe tek cümleyle kendini tanıt.\"}],\"max_tokens\":128,\"temperature\":0.7,\"stream\":false}" \
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

To run real provider routing automatically, ensure Ollama has $SMOKE_MODEL, then run:
RUN_PROVIDER_E2E=1 examples/curl/06_local_smoke.sh

Manual mode is still available:
cd "$ROOT/apps/provider-node" && go run ./cmd/provider-node serve --config "$PROVIDER_CONFIG"
Then call chat with examples/curl/05_chat_completion.sh or rerun this script with RUN_CHAT=1.
OUT
