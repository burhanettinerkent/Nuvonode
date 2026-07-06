# 09 — Routing, Metering, and Credits

## Routing requirements

The router must select a provider that satisfies all hard filters:

1. Provider approval status = `approved`
2. Provider status = `active`
3. Provider instance status = `online`
4. Heartbeat is fresh
5. Provider model advertisement status = `approved`
6. Model status = `active`
7. Model version status = `active`
8. Provider has no current job if `max_concurrent_jobs=1`
9. Provider hardware meets model minimum VRAM if hardware is known

## Routing score

After hard filters, compute score:

```txt
score =
  trust_score * 0.35 +
  success_score * 0.25 +
  latency_score * 0.20 +
  capacity_score * 0.10 +
  freshness_score * 0.10
```

Where:

```txt
trust_score: 0-100 from provider_stats or default 20 for new approved provider
success_score: success_rate * 100, default 50
latency_score: clamp(100 - avg_latency_ms / 50, 0, 100)
capacity_score: 100 if queue_depth=0 else max(0, 100 - queue_depth*50)
freshness_score: 100 if heartbeat <= 15s, 50 if <= 30s, 0 otherwise
```

For ties, prefer provider with fewer total jobs to distribute early community usage.

## No paid fallback in V1

If no community/managed provider is available, return:

```json
{
  "error": {
    "code": "model_unavailable",
    "message": "No approved online provider is currently available for this model.",
    "request_id": "req_..."
  }
}
```

Do not call external paid APIs unless `EXTERNAL_CONNECTORS_ENABLED=true` and admin configured a connector.

## Credit unit

Use integer credits. No decimals in ledger.

V1 credit disclaimer:

```txt
Credits are internal platform credits. They are not money, cannot be withdrawn, cannot be sold, and have no cash value in V1.
```

## Pricing formula

For a model:

```txt
input_credit_per_1k = 10
output_credit_per_1k = 20
provider_reward_ratio = 0.70
```

Cost:

```txt
input_cost = ceil(input_tokens * input_credit_per_1k / 1000)
output_cost = ceil(output_tokens * output_credit_per_1k / 1000)
total_cost = input_cost + output_cost
provider_reward = floor(total_cost * provider_reward_ratio)
platform_margin = total_cost - provider_reward
```

Platform margin is internal credit accounting only in V1. It is not cash profit.

## Reservation example

User has 10,000 credits.

Request estimated max cost = 500 credits.

Ledger:

```txt
reserve: amount_credits=-500, reserved_delta=+500
```

Wallet:

```txt
balance_credits=9500
reserved_credits=500
```

Actual cost = 320.

Finalize:

```txt
release_reserve: amount_credits=+500, reserved_delta=-500
debit_usage: amount_credits=-320
credit_provider_reward: +224 to provider wallet
```

User final balance: 9,680.
Provider earns: 224 internal credits.

## Insufficient credits

If estimated cost is higher than available balance:

- Do not create provider job.
- Return `insufficient_credits`.
- Do not write reserve ledger.

## Provider reward timing

Provider reward is credited only after:

- Job succeeds
- Usage record is created
- User debit is finalized
- No duplicate settlement exists

## Abuse protections

Provider cannot self-generate billable credits by calling their own model endlessly if rate limits/project limits are applied, but V1 still needs controls:

- Starting free credits are limited.
- Admin can disable users/providers.
- Admin can inspect suspicious usage.
- Rate limit per API key.
- Project monthly credit limit.
- Provider reward can be set to zero for suspicious providers.
- Manual admin adjustment can reverse credits with reason.

## Provider fraud controls for V1

Minimum controls:

1. Server-side token estimate validation.
2. Provider success/failure tracking.
3. Latency outlier tracking.
4. Same owner using same provider is allowed in local dev but flagged in admin in public mode.
5. Admin approval required for provider model advertisements.
6. Provider cannot set its own price.
7. Provider cannot mark job succeeded without job id issued by server.

## Future payout note

Do not design V1 UI text that promises money. Use:

> In future versions, the project may explore payout options if funding, legal structure, abuse controls, and community demand make it sustainable.
