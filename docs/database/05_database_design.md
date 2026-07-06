# 05 — Database Design

The full SQL schema is in `database/schema_v1.sql` and `database/migrations/000001_init.up.sql`.

## Design principles

- PostgreSQL is the source of truth.
- Redis must not contain the only copy of financial/credit state.
- Wallet ledger is immutable.
- Usage records are immutable after settlement.
- Provider presence is ephemeral and can be reconstructed from heartbeats.
- Public IDs are used in APIs; UUIDs are internal.

## Important tables

### users

Stores dashboard users and admins.

### projects

Groups API usage under an owner. V1 supports one owner; multi-member projects can be added later.

### api_keys

Stores hashed API keys for project access.

### wallets

Represents available and reserved internal credits for a user, project, or provider.

### wallet_ledger

Every balance movement is recorded here.

Ledger examples:

```txt
grant +10000
reserve -500 available, +500 reserved
release_reserve +500 available, -500 reserved
debit_usage -320
credit_provider_reward +224
admin_adjustment +1000
refund +50
```

### models

Public model catalog. The `slug` is used in API requests.

### model_versions

Runtime-level mapping, such as Ollama model tag or future external connector model id.

### providers

Provider account owned by a user.

### provider_instances

Live machine/process connected by WebSocket.

### provider_model_advertisements

Provider says: "I can run this runtime model." Admin approves before routing production jobs to it.

### inference_jobs

Lifecycle of one inference request.

### usage_records

Settled usage with token counts, cost, reward, and latency.

### external_model_connectors

Disabled-by-default placeholder for future optional paid connectors.

## Wallet consistency

The API must perform wallet operations inside a transaction.

Required transaction pattern:

```sql
BEGIN;
SELECT * FROM wallets WHERE id = $1 FOR UPDATE;
-- validate balance
-- insert wallet_ledger row
-- update wallets cached balance/reserved
COMMIT;
```

Never directly change `wallets.balance_credits` outside wallet service.

## Project spend period

`projects.spend_period` uses `YYYY-MM`. On first request in a new month:

1. Reset `current_month_spend` to 0.
2. Set `spend_period` to current UTC month.
3. Continue validation.

## Model pricing

Use integer credits per 1,000 tokens.

```txt
cost = ceil(input_tokens * input_credit_per_1k / 1000) + ceil(output_tokens * output_credit_per_1k / 1000)
provider_reward = floor(cost * provider_reward_ratio)
```

For V1, keep pricing simple and visible.

## Provider trust score

`provider_stats.trust_score` can be recalculated after each job:

```txt
base = success_rate * 70
latency_bonus = max(0, 20 - avg_latency_ms / 500)
uptime_bonus = 10 if provider has recent heartbeats and > 10 successful jobs
trust_score = clamp(base + latency_bonus + uptime_bonus, 0, 100)
```

This formula can be refined later.
