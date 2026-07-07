# Nuvonode Mesh

Nuvonode Mesh is an open-source AI inference network for open models.

Developers call one OpenAI-compatible API. GPU owners run a provider node on their own machine. The network routes approved jobs to healthy providers, records usage, and rewards providers with internal platform credits.

V1 is intentionally simple: local Ollama providers, PostgreSQL as source of truth, Redis for ephemeral state, and internal credits for usage and provider rewards.

## Who this is for

### Developers using AI models

Use Nuvonode when you want:

- One API for community-hosted open models
- OpenAI-compatible `/v1/models` and `/v1/chat/completions`
- Project API keys
- Usage history
- Internal credits for usage

### GPU owners sharing compute

Run `nuvonode-provider` if you want to:

- Share your local GPU/CPU Ollama models with the network
- Connect outbound over WebSocket, no port forwarding required
- Serve approved inference jobs
- Earn internal platform credits for successful completed jobs

Providers earn internal platform credits for successful completed jobs.

### Contributors

Help build:

- Core API
- Provider node
- Dashboard
- Model registry
- Routing and scoring
- Usage metering
- Tests and docs
- Security hardening

See [CONTRIBUTING.md](CONTRIBUTING.md).

## What V1 does

- User registration and login
- Project and API key management
- Wallets and immutable credit ledger
- Model registry
- Provider registration and provider tokens
- Provider WebSocket connection and heartbeat
- Provider model advertisement approval
- Ollama-based provider execution
- OpenAI-compatible `/v1/models`
- OpenAI-compatible non-streaming `/v1/chat/completions`
- Usage metering and settlement
- Admin moderation endpoints
- Local Docker Compose stack

## What V1 does not do

- No public pricing marketplace
- No default paid external model calls
- No 70B+ distributed model execution by default
- No enterprise privacy guarantee for prompts routed to community machines

## Credit model

Nuvonode uses internal credits to track usage and provider rewards.

- Users spend credits when they call models.
- Providers earn credits when approved jobs complete successfully.
- Every credit movement is written to `wallet_ledger`.
- Wallet balance updates and ledger entries happen in the same transaction.

## Security and privacy boundary

Community providers are semi-trusted machines. Do not send secrets, regulated data, private customer data, or confidential business content to community-routed models.

The platform must not send platform secrets to providers. API keys and provider tokens are stored hashed. Prompt logging is disabled by default.

Report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## Repository layout

```txt
apps/api              Go Fiber backend
apps/provider-node    Go CLI provider node for local Ollama machines
apps/web              Next.js dashboard
build                 Optional local build output, ignored if generated
database              SQL schema, migrations, seeds
docs                  Product, architecture, API, database, security, roadmap docs
examples/curl         Local smoke-test curl scripts
.github               Issue templates and repository workflow files
```

## Requirements

- Go 1.22+
- Docker + Docker Compose
- PostgreSQL 16+ for non-Docker setups
- Redis 7+ for non-Docker setups
- Ollama for provider-node runtime
- Node.js for dashboard development

## Local quick start

```bash
cp .env.example .env
docker compose up -d
make migrate-up
make seed
make api
```

In another terminal:

```bash
make provider
```

In another terminal for dashboard work:

```bash
make web
```

If `make` is unavailable, run commands directly:

```bash
cd apps/api && go run ./cmd/api
cd apps/provider-node && go run ./cmd/provider-node serve
cd apps/web && npm run dev
```

## Run migrations and seed data

```bash
make migrate-up
make seed
```

Rollback local schema:

```bash
make migrate-down
```

Default local database URL:

```txt
postgres://nuvonode:nuvonode@localhost:5432/nuvonode?sslmode=disable
```

These credentials are development-only.

## Run tests

```bash
cd apps/api && go test ./...
cd apps/provider-node && go test ./...
```

Optional DB integration test example:

```bash
NUVONODE_RUN_DB_TESTS=1 \
DATABASE_URL='postgres://nuvonode:nuvonode@localhost:5432/nuvonode?sslmode=disable' \
go test ./apps/api/internal/service -run TestAdminAdjustWalletIntegration -v
```

## Basic API flow

### Health

```bash
curl http://localhost:8080/health
```

### Register

```bash
curl http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","display_name":"Test User"}'
```

The first user can become admin in local development when `BOOTSTRAP_FIRST_USER_ADMIN=true`.

### Login

```bash
curl http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Set returned token:

```bash
export JWT='paste_access_token_here'
```

### Create project

```bash
curl http://localhost:8080/api/projects \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Local App","monthly_credit_limit":null}'
```

### Create API key

```bash
curl http://localhost:8080/api/projects/$PROJECT_ID/api-keys \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Local dev key"}'
```

Set returned one-time key:

```bash
export NUVONODE_API_KEY='paste_plaintext_key_here'
```

### List models

```bash
curl http://localhost:8080/v1/models \
  -H "Authorization: Bearer $NUVONODE_API_KEY"
```

### Chat completion

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer $NUVONODE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model":"qwen-7b-instruct",
    "messages":[{"role":"user","content":"Hello"}],
    "stream":false
  }'
```

A provider must be approved, online, and advertising an approved model for chat routing to succeed.

## Run a provider node

A provider node is a local process that connects outward to the API over WebSocket and serves jobs through Ollama.

### 1. Install and start Ollama

Install Ollama from the official project, then pull a supported local model, for example:

```bash
ollama pull qwen:7b
ollama serve
```

### 2. Register provider in API

```bash
curl http://localhost:8080/api/providers \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"My local GPU","region_hint":"local","allow_auto_model_pull":false}'
```

Copy the returned provider token once.

### 3. Initialize provider config

```bash
cd apps/provider-node
go run ./cmd/provider-node init \
  --server http://localhost:8080 \
  --token "$PROVIDER_TOKEN" \
  --name "My local GPU" \
  --ollama-url http://localhost:11434
```

### 4. Check provider health

```bash
go run ./cmd/provider-node doctor
```

### 5. Run provider

```bash
go run ./cmd/provider-node serve
```

Admin approval is required before production routing. In local development, `ALLOW_DEV_AUTO_APPROVE_PROVIDER=true` can auto-approve providers.

## How providers earn credits

1. Provider registers and stores provider token locally.
2. Provider node connects to API.
3. Provider sends hardware and Ollama model information.
4. Admin approves provider.
5. Admin approves provider model advertisement.
6. Router sends eligible jobs to provider.
7. Provider runs model through Ollama.
8. API validates token counts and settles usage.
9. User wallet is debited.
10. Provider wallet is credited with internal credits.

Provider credits appear in the provider wallet after settlement.

## Admin moderation

Admin endpoints support:

- Provider approve/reject/disable
- Provider model advertisement approve/reject
- Model create/update/pause
- Jobs and usage inspection
- Wallet adjustment with ledger and audit log

Admin moderation exists because community providers are semi-trusted machines.

## Roadmap

### V1 backbone

- Local development stack
- Auth, projects, API keys
- Wallet ledger and credits
- Model registry
- Provider node and WebSocket protocol
- Ollama adapter
- Non-streaming chat completions
- Usage metering and settlement
- Functional dashboard
- Curl smoke scripts
- Tests and security hardening

### V1.1

- Streaming chat completions
- Better dashboard UX
- More provider health and benchmark signals
- More automated end-to-end smoke tests
- Improved routing score based on production data

### V2

- More runtimes and model families
- Stronger provider trust tiers
- Optional external model connectors behind explicit operator config
- Better abuse detection and moderation workflows

### Not planned for V1

- Public pricing marketplace
- Default paid external providers
- Distributed 70B+ model splitting across home machines

## Contributing

Good contributions are small, testable, and aligned with V1 scope.

Before opening a pull request:

- Run API/provider tests.
- Update docs when behavior changes.
- Keep changes aligned with the V1 provider-credit model.
- Do not log prompts by default.
- Do not introduce arbitrary command execution in provider-node.
- Keep provider nodes semi-trusted.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## GitHub topics

Suggested repository topics:

```txt
ai llm inference gpu ollama open-source openai-compatible go postgresql redis websocket community model-router ai-infrastructure
```

## License

Apache-2.0. See [LICENSE](LICENSE).
