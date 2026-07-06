# 12 — External Model Connectors

## V1 position

External model connectors are optional and disabled by default. The project must not require external paid APIs to run.

```env
EXTERNAL_CONNECTORS_ENABLED=false
```

When disabled:

- Do not call external paid APIs.
- Do not show external models as available.
- Do not silently fallback to external models.
- Return `model_unavailable` if no community/managed provider exists.

## Why defer external models

The maintainer currently has no budget to pay for large model inference. A public system that allows users to spend free/internal credits on paid external APIs could create direct financial loss.

## Optional future use

External connectors may later be used for:

- Large model fallback
- 70B+ or frontier-level model access
- Managed premium routes
- Benchmark comparison

Only enable when operator has:

- Budget limit
- Rate limit
- Admin-only model exposure
- Clear pricing
- Abuse protection
- Terms/license compliance

## Connector abstraction

Future interface:

```go
type ExternalConnector interface {
    Name() string
    ChatCompletion(ctx context.Context, req ChatCompletionRequest) (ChatCompletionResponse, error)
    EstimateCost(req ChatCompletionRequest) (credits int64, err error)
}
```

## Database placeholder

`external_model_connectors` table exists in schema but all rows should default disabled.

## Config rules

Required safeguards before any implementation calls an external provider:

```txt
EXTERNAL_CONNECTORS_ENABLED=true
EXTERNAL_CONNECTOR_MONTHLY_BUDGET_CREDITS > 0
MODEL.external_only=true or route policy explicitly includes external
ADMIN_APPROVED_CONNECTOR=true
```

## V1 API behavior

If model is `external_only=true` and connectors disabled:

```json
{
  "error": {
    "code": "external_connectors_disabled",
    "message": "This model requires an external connector, but external connectors are disabled on this deployment.",
    "request_id": "req_..."
  }
}
```

## 70B+ plan

70B+ support has three possible future paths:

1. **Managed provider path**: A trusted operator or sponsor runs large GPU machines.
2. **External connector path**: Admin enables paid external providers with budget limits.
3. **Research distributed path**: Explore splitting models across nodes after V1 is stable.

V1 implements none of these as required runtime behavior.
