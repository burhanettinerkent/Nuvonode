# 15 — Testing and Acceptance

## Test levels

### Unit tests

Required:

- Password hashing verify
- API key generation/hash/lookup
- Provider token generation/hash/lookup
- Wallet reserve/finalize/refund math
- Pricing formula
- Routing score
- Token estimator
- Error response format

### Integration tests

Required:

- Register/login creates user wallet with starting credits
- Create project and API key
- Provider WebSocket auth accepts valid token
- Provider heartbeat marks instance online
- Fake provider receives job and returns result
- Chat completion creates job, usage, wallet debit, provider credit
- Failed provider job releases reservation
- Insufficient credits prevents dispatch

### End-to-end manual acceptance

Use scripts in `examples/curl`.

## Acceptance script sequence

1. Start database and Redis.
2. Run migrations.
3. Seed models.
4. Start API.
5. Register user.
6. Create project.
7. Create API key.
8. Create provider.
9. Start provider node.
10. Admin approve provider.
11. Admin approve provider model advertisement.
12. Call `/v1/chat/completions`.
13. Confirm usage appears.
14. Confirm user credits decreased.
15. Confirm provider credits increased.

## Fake provider test

The API tests should include a fake in-memory provider connection so CI does not require Ollama/GPU.

Fake provider behavior:

- Connects WebSocket with test provider token.
- Sends hello/heartbeat/model list.
- On job request, returns fixed response.

## Curl scripts

Scripts must be simple and readable. They can assume `jq` is installed.

Environment variables:

```bash
export API=http://localhost:8080
export EMAIL=test@example.com
export PASSWORD=password123
```

## Done definition for V1

V1 is done when:

- Fresh clone can run local stack from README.
- All migrations apply cleanly.
- Seed creates active models.
- Dashboard can create project/API key/provider.
- Provider node can connect and serve at least one local model.
- OpenAI-compatible chat endpoint returns valid response.
- Ledger and usage records are correct.
- Admin can approve providers and model advertisements.
- Tests pass.
- Docs explain internal-credit-only limitation clearly.
