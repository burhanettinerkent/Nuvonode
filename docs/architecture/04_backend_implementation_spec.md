# 04 — Backend Implementation Spec

## Runtime configuration

Read configuration from environment variables. Provide defaults for local development only.

Required variables:

```txt
APP_ENV=development
HTTP_ADDR=:8080
PUBLIC_API_BASE_URL=http://localhost:8080
PUBLIC_WEB_BASE_URL=http://localhost:3000
DATABASE_URL=postgres://nuvonode:nuvonode@localhost:5432/nuvonode?sslmode=disable
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=change_me
API_KEY_PEPPER=change_me
PROVIDER_TOKEN_PEPPER=change_me
STARTING_FREE_CREDITS=10000
CREDIT_SCALE=1000000
PROVIDER_HEARTBEAT_TIMEOUT_SECONDS=45
JOB_TIMEOUT_SECONDS=120
EXTERNAL_CONNECTORS_ENABLED=false
ALLOW_DEV_AUTO_APPROVE_PROVIDER=true
LOG_PROMPTS=false
```

## HTTP middleware

Every request must pass through:

1. Request ID middleware
2. Structured logging middleware
3. Recover middleware
4. CORS middleware for dashboard
5. Rate limit middleware for public API endpoints
6. Auth middleware where required

Every response should include:

```txt
x-request-id: req_...
```

## Auth model

### Dashboard auth

- Register with email, password, display name.
- Store password hash using bcrypt or Argon2id.
- Login returns JWT access token.
- JWT contains `user_id`, `email`, `role`, `exp`.
- Roles: `user`, `admin`.
- First user can become admin if `BOOTSTRAP_FIRST_USER_ADMIN=true`.

### API key auth

API key format:

```txt
pvn_live_<public_prefix>_<secret>
```

Storage:

- Store `public_id`.
- Store `prefix` for display.
- Store `hash = sha256(API_KEY_PEPPER + full_key)` or stronger HMAC.
- Never store full key.
- Show plaintext key only once.

Request auth:

```txt
Authorization: Bearer pvn_live_...
```

Resolve to project and owner user.

### Provider token auth

Provider token format:

```txt
pvn_provider_<public_prefix>_<secret>
```

Used only by provider node WebSocket connection.

## REST endpoints

### Health

`GET /health`

Response:

```json
{
  "status": "ok",
  "db": "ok",
  "redis": "ok",
  "version": "dev"
}
```

### Auth

`POST /api/auth/register`

Request:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "Burhan"
}
```

Response:

```json
{
  "user": {
    "id": "usr_...",
    "email": "user@example.com",
    "display_name": "Burhan",
    "role": "user"
  },
  "access_token": "jwt..."
}
```

`POST /api/auth/login`

`GET /api/me`

### Projects

`GET /api/projects`

`POST /api/projects`

Request:

```json
{
  "name": "My App",
  "monthly_credit_limit": null
}
```

`GET /api/projects/{project_id}`

`PATCH /api/projects/{project_id}`

`DELETE /api/projects/{project_id}` soft deletes.

### API keys

`GET /api/projects/{project_id}/api-keys`

`POST /api/projects/{project_id}/api-keys`

Request:

```json
{
  "name": "Local dev key"
}
```

Response includes plaintext key once:

```json
{
  "api_key": {
    "id": "key_...",
    "name": "Local dev key",
    "prefix": "abc123",
    "created_at": "..."
  },
  "plaintext_key": "pvn_live_abc123_secret..."
}
```

`DELETE /api/projects/{project_id}/api-keys/{key_id}` revokes.

### Wallet

`GET /api/wallet`

Response:

```json
{
  "balance_credits": 10000,
  "reserved_credits": 0,
  "disclaimer": "Credits are internal platform credits and cannot be withdrawn or converted to cash in V1."
}
```

`GET /api/wallet/ledger`

### Models

`GET /api/models`

Returns public active models.

`GET /api/models/{slug}`

### Providers

`GET /api/providers`

`POST /api/providers`

Request:

```json
{
  "name": "Home RTX 4090",
  "region_hint": "TR",
  "allow_auto_model_pull": false
}
```

Response includes provider token once.

`GET /api/providers/{provider_id}`

`PATCH /api/providers/{provider_id}`

`POST /api/providers/{provider_id}/rotate-token`

`POST /api/providers/{provider_id}/disable`

### Usage

`GET /api/usage?project_id=&from=&to=&model=`

### Admin

All admin endpoints require `role=admin`.

- `GET /api/admin/providers`
- `POST /api/admin/providers/{provider_id}/approve`
- `POST /api/admin/providers/{provider_id}/reject`
- `POST /api/admin/providers/{provider_id}/disable`
- `GET /api/admin/provider-models/pending`
- `POST /api/admin/provider-models/{id}/approve`
- `POST /api/admin/provider-models/{id}/reject`
- `GET /api/admin/models`
- `POST /api/admin/models`
- `PATCH /api/admin/models/{model_id}`
- `POST /api/admin/models/{model_id}/pause`
- `POST /api/admin/wallets/{user_id}/adjust`
- `GET /api/admin/jobs`
- `GET /api/admin/usage`

## Wallet transaction rules

Use database transactions with row locking.

### Reserve flow

1. Estimate cost.
2. Lock wallet row.
3. Check available balance.
4. Insert ledger row type `reserve` with negative available effect and positive reserved effect.
5. Update wallet cached balance/reserved.

### Finalize flow

1. Lock wallet row.
2. Calculate actual cost.
3. Release full reservation.
4. Insert actual debit.
5. If actual cost < reserved, difference returns to available.
6. Insert provider reward credit.
7. Write usage record.
8. Mark job settled.

### Failure flow

If provider fails or job times out before successful completion:

1. Release reservation.
2. Mark job failed.
3. No provider reward.
4. Return structured error.

## Token estimation

V1 can use an approximate tokenizer if exact tokenizers are unavailable. Use deterministic estimation:

```txt
estimated_input_tokens = ceil(character_count / 4)
estimated_max_output_tokens = request.max_tokens or model.default_max_output_tokens
```

After response, provider returns usage if runtime supplies it. Server validates against text length:

```txt
minimum_reasonable_tokens = ceil(response_character_count / 8)
maximum_reasonable_tokens = ceil(response_character_count / 2) + 100
```

If provider token count is outside range, server uses its own estimate and flags usage as `server_estimated`.

## Job timeout

Default job timeout: 120 seconds.

If timeout occurs:

- Mark job `timed_out`.
- Release reservation.
- Increment provider failure count.
- Return `provider_timeout`.

## Idempotency

Public inference endpoint accepts optional header:

```txt
Idempotency-Key: unique-client-key
```

Store idempotency result for 24 hours in Redis keyed by project + endpoint + key.

## Error codes

Use these exact codes:

- `invalid_request`
- `unauthorized`
- `forbidden`
- `not_found`
- `rate_limited`
- `model_not_found`
- `model_unavailable`
- `insufficient_credits`
- `provider_unavailable`
- `provider_timeout`
- `provider_failed`
- `streaming_not_implemented`
- `external_connectors_disabled`
- `internal_error`
