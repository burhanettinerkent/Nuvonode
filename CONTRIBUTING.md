# Contributing to Nuvonode Mesh

Thanks for helping build Nuvonode Mesh.

Nuvonode is a community AI inference mesh. V1 focuses on a reliable backbone: OpenAI-compatible API, provider node, routing, internal credits, usage metering, and dashboard.

## Ground rules

V1 scope is strict:

- Internal credits only
- No fiat payouts
- No crypto or token payouts
- No withdrawal system
- No required paid external model calls
- Ollama is the required local provider runtime
- Provider nodes connect outbound over WebSocket
- Prompt logging disabled by default
- Provider nodes treated as semi-trusted

## Good first contribution areas

- Tests for API and provider-node flows
- Dashboard pages and forms
- Curl smoke scripts
- Provider-node UX improvements
- Model registry improvements
- Documentation examples
- Error response consistency
- Security hardening without changing product scope

## Development setup

```bash
cp .env.example .env
docker compose up -d
make migrate-up
make seed
```

Run API:

```bash
cd apps/api && go run ./cmd/api
```

Run provider-node:

```bash
cd apps/provider-node && go run ./cmd/provider-node serve
```

Run tests:

```bash
cd apps/api && go test ./...
cd apps/provider-node && go test ./...
```

## Pull request checklist

Before opening a PR:

- [ ] Change is inside V1 scope or clearly marked future-scope docs only.
- [ ] API/provider tests pass.
- [ ] Database migrations are safe and reversible when applicable.
- [ ] Credit movements write `wallet_ledger` in the same transaction as balance updates.
- [ ] API keys, provider tokens, and authorization headers are not logged.
- [ ] Prompt/completion bodies are not logged by default.
- [ ] Docs or README updated if behavior changed.
- [ ] PR description includes verification commands and results.

## Branch and PR flow

1. Fork the repository or create a feature branch.
2. Keep the change small and focused.
3. Add tests for behavior changes.
4. Open a pull request against `main`.
5. Maintainers review for scope, security, tests, and rollout risk.

## What not to add without prior design discussion

- Cash payout logic
- Crypto/token mechanics
- Provider withdrawal flows
- Default paid external model usage
- Distributed tensor/model parallelism across random home machines
- Arbitrary command execution in provider-node
- Prompt logging enabled by default

## Security-sensitive changes

Open a discussion before large changes touching:

- Auth
- API key/provider token storage
- Wallet ledger
- Usage settlement
- Provider WebSocket protocol
- Admin moderation
- Prompt/privacy boundaries

For vulnerabilities, follow [SECURITY.md](SECURITY.md) and do not open a public issue with exploit details.
