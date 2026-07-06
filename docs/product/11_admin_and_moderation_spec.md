# 11 — Admin and Moderation Spec

## Why admin moderation is required

Nuvonode routes user prompts to machines owned by other people. V1 must avoid routing jobs to unverified, broken, malicious, or misconfigured providers.

## Admin roles

V1 uses one role: `admin`.

Future roles:

- moderator
- billing_admin
- infrastructure_admin

## Provider approval

Provider starts as `pending`.

Admin can approve after checking:

- Owner account is not disabled
- Provider connected successfully at least once
- Hardware report exists
- Ollama model list exists
- No suspicious metadata
- Provider understands V1 credits have no cash value

In local development only, `ALLOW_DEV_AUTO_APPROVE_PROVIDER=true` can auto-approve providers.

## Provider model advertisement approval

Provider model advertisement starts as `pending`.

Admin maps it to:

- `models.id`
- `model_versions.id`

Then approves or rejects.

Approval checklist:

- Runtime model name matches expected model
- Hardware meets minimum VRAM
- Benchmark is reasonable
- Model license notes are acceptable
- Model is community-allowed

## Suspicious patterns

Admin dashboard should help detect:

- Same user spending credits on own provider repeatedly
- Very high token claims with short output
- Very low latency impossible for model size
- High failure rate
- Many accounts from same IP hash consuming free credits
- Provider rapidly reconnecting
- Provider returning identical outputs

V1 does not need perfect fraud prevention, but it must expose enough data to moderate.

## Admin wallet adjustment

Manual wallet adjustment requires:

- Admin user id
- Wallet id
- Amount
- Reason
- Audit log entry

Examples:

- Free credit grant for alpha tester
- Reverse suspicious provider rewards
- Refund failed request if automatic refund failed

## Disable actions

Admin can disable:

- User
- Project
- API key
- Provider
- Model
- Provider model advertisement

Disabled providers must be disconnected by server if currently online.

## Audit log actions

Write audit log for:

- Provider approved/rejected/disabled
- Provider trust level changed
- Model created/updated/paused
- Provider model advertisement approved/rejected
- Wallet manual adjustment
- User disabled
- Project disabled

## Admin safety

Admin endpoints must never expose:

- API key plaintext
- Provider token plaintext
- Password hashes
- Raw prompts, unless `LOG_PROMPTS=true` and admin debug route is explicitly built later

Prompt logging is disabled in V1.
