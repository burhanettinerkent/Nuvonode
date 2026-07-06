# 16 — Roadmap

## V1 — Working backbone

Goal: prove full loop with small/mid open models and internal credits.

Features:

- User auth
- Projects
- API keys
- Internal credits
- Wallet ledger
- Model registry
- Provider registration
- Provider node with Ollama
- Provider WebSocket protocol
- Manual provider approval
- Manual provider model approval
- Router
- Non-streaming chat completions
- Usage metering
- User dashboard
- Admin dashboard
- Curl acceptance scripts

No:

- Cash payouts
- 70B+ community distributed inference
- Required external paid APIs
- Enterprise privacy guarantees

## V1.1 — Usability and reliability

Features:

- Streaming chat completions
- Provider auto-update flow
- Better Windows installer
- Better provider benchmark
- Model pull UI
- More accurate tokenizers
- Provider queue depth
- Retry to second provider if first provider fails before generation
- Basic embeddings endpoint
- Improved dashboard charts

## V1.2 — Community hardening

Features:

- Provider reputation page
- Abuse reports
- Invite codes / alpha access
- Better IP/account abuse controls
- Provider allowlist per project
- Public status page
- Model quality feedback
- OpenTelemetry traces

## V2 — Model ecosystem expansion

Features:

- More runtimes: llama.cpp, vLLM for managed providers
- Image generation providers
- Speech-to-text providers
- Rerank/embedding endpoints
- External connector support with strict budget controls
- Managed provider tier
- Organization/team accounts
- Private managed route option
- Better license/compliance tracking

70B+ path in V2:

- Only through managed provider or external connector.
- Community home GPU routing remains for smaller models.
- No random distributed tensor parallelism unless separate research milestone succeeds.

## V3 — Marketplace and sustainability

Possible features if community and legal/financial structure exists:

- Fiat provider payouts
- KYC/tax/invoicing
- Paid user plans
- Sponsored models
- Enterprise private providers
- SLA-based routing
- True marketplace pricing
- Distributed large-model experiments

V3 payout work must not be started until:

- Legal structure is defined
- Fraud controls are mature
- Billing provider is chosen
- Tax/fatura requirements are understood
- Abuse and chargeback risks are handled
