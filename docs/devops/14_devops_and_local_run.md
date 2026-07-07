# 14 — DevOps and Local Run

## Local requirements

- Docker and Docker Compose
- Go toolchain
- Node.js for dashboard
- Ollama installed locally for provider-node testing
- At least one local Ollama model pulled manually

## Docker Compose services

- PostgreSQL 16
- Redis 7
- Optional pgAdmin profile

The API, provider node, and web app can run directly during development.

## Make targets

Implement these targets:

```makefile
make dev-db          # docker compose up postgres redis
make migrate-up      # run migrations
make migrate-down    # rollback migrations
make seed            # run seed SQL
make api             # run apps/api
make provider        # run apps/provider-node serve
make web             # run apps/web
make test            # run backend/provider tests
make fmt             # format Go and web code
make lint            # basic lint if configured
```

## Environment file

Use `.env.example` as template.

Local `.env` must not be committed.

## Local happy path

```bash
cp .env.example .env
docker compose up -d
make migrate-up
make seed
make api
```

In another terminal:

```bash
make web
```

In another terminal:

```bash
nuvonode-provider init --server http://localhost:18080 --token <provider-token> --name "Local Provider"
nuvonode-provider doctor
nuvonode-provider serve
```

## Production alpha suggestion

For early alpha:

- One VPS is enough for API + web + PostgreSQL + Redis if traffic is low.
- Use HTTPS/WSS.
- Keep provider approval manual.
- Keep free credits low.
- Disable external connectors.
- Disable prompt logging.

## Backups

Backup PostgreSQL daily in any public deployment. Redis backup is less critical for V1 because PostgreSQL is source of truth.

## Observability

Minimum logs:

- Request id
- Path
- Status
- Duration
- User/project id if authenticated
- Job id
- Provider id
- Error code

Do not log prompt content.

Metrics to expose later:

- Requests per minute
- Jobs succeeded/failed
- Provider online count
- Average latency
- Wallet debit/credit totals
- Model availability
