# 02 — System Architecture

## Logical components

```txt
                         +------------------+
                         |  Web Dashboard   |
                         |  User/Admin UI   |
                         +--------+---------+
                                  |
                                  | HTTPS
                                  v
+------------------+     +--------+---------+       +------------------+
| API Users        | --> | Core API          | <---- | Admin            |
| OpenAI clients   |     | Auth/API/Router   |       | Moderation UI    |
+------------------+     +----+---------+---+       +------------------+
                              |         |
                              |         |
                              v         v
                       +------+--+   +--+--------+
                       |Postgres|   | Redis      |
                       |Truth DB|   | Presence   |
                       +---------+  | Jobs/Rate  |
                                    +-----------+
                              ^
                              |
                              | outbound WebSocket from provider
                              |
+------------------+     +----+------------------+
| Ollama           | <-- | Provider Node         |
| Local runtime    |     | GPU owner machine     |
+------------------+     +-----------------------+
```

## Services

### apps/api

Main backend service.

Responsibilities:

- HTTP REST API
- OpenAI-compatible API
- Dashboard auth
- API key auth
- Provider WebSocket endpoint
- Routing
- Job dispatch
- Usage metering
- Wallet ledger transaction handling
- Admin operations

### apps/provider-node

Local CLI app run by provider users.

Responsibilities:

- Read config
- Validate provider token
- Connect to API via WebSocket
- Detect local hardware
- Check Ollama availability
- Advertise available models
- Pull allowed model if explicitly requested and enabled
- Execute inference through Ollama
- Return job result
- Send heartbeat and local telemetry

### apps/web

Dashboard.

Responsibilities:

- User auth screens
- API key management
- Credits/usage UI
- Provider setup wizard
- Provider status UI
- Model catalog
- Admin moderation screens

### database

Migrations, schema, seeds, and local development data.

## Data flow: chat completion

```txt
1. Client sends POST /v1/chat/completions with Bearer API key.
2. Core API hashes key and resolves project/user.
3. Core API validates model exists and is active.
4. Core API estimates max possible cost from prompt tokens + max_tokens.
5. Core API checks wallet/project spend limit.
6. Router finds online approved providers that support the model.
7. Router scores providers.
8. Core API creates inference job row.
9. Core API reserves estimated credits in wallet ledger.
10. Core API sends job_request over provider WebSocket.
11. Provider runs Ollama request.
12. Provider returns job_result.
13. Core API validates result shape and token counts.
14. Core API stores usage record.
15. Core API finalizes actual user debit and releases/refunds unused reservation.
16. Core API credits provider internal reward.
17. Core API returns OpenAI-compatible response.
```

## Data flow: provider setup

```txt
1. User opens dashboard -> Providers -> Create provider.
2. API creates provider row and provider token.
3. Dashboard shows one-time token and setup command.
4. User installs Ollama and provider node.
5. User runs provider init command.
6. Provider writes config file.
7. User runs provider doctor.
8. User runs provider serve.
9. Provider sends hello to API WebSocket.
10. API stores provider instance online state.
11. Provider sends hardware, Ollama model list, benchmark.
12. Admin approves provider or auto-approves if config allows local dev.
```

## Trust levels

### community

Default provider type. Prompts may be processed on a user-owned machine. Only non-sensitive workloads should be routed here.

### verified

Provider manually approved by admin after benchmark, identity/contact check, and uptime history. Still not enterprise-private.

### managed

Provider controlled by project operator. Can be used for higher reliability and optional external connector workloads.

## V1 routing mode

V1 supports one-job-per-provider-instance by default. Queue depth can be added but must remain conservative to avoid overloading home GPUs.

## External model connector position

An external paid model connector can be designed but must be disabled by default:

```env
EXTERNAL_CONNECTORS_ENABLED=false
```

When disabled, no user request should call paid external APIs.

## Deployment modes

### Local development

- Docker Compose: PostgreSQL + Redis
- API on localhost
- Web dashboard on localhost
- Provider node on same machine
- Ollama running locally

### Small public alpha

- One VPS for API, web, PostgreSQL, Redis
- Community providers connect from home machines
- Manual provider approval
- Manual model approval
- Credits remain internal

### Future production

- API replicas
- Managed Postgres
- Managed Redis
- Object storage for logs/artifacts if needed
- Observability stack
- Separate worker service if job volume grows
