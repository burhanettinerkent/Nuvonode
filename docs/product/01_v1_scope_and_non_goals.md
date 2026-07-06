# 01 — V1 Scope and Non-Goals

## V1 objective

Create a working open-source backbone that proves the full loop:

```txt
API user -> API key -> chat request -> router -> provider node -> Ollama -> response -> usage record -> credit debit -> provider credit reward
```

## V1 must ship

### User and project management

- User registration
- User login
- JWT session for dashboard
- Project creation
- Project members can be added later; V1 can use one owner per project
- API key creation, listing, revocation
- API key prefix display only; plaintext key shown once

### Internal credit wallet

- One wallet per user
- One wallet per provider owner
- One optional project-level spend limit
- Immutable ledger entries
- Balance derived from ledger or cached balance updated transactionally
- Starting free credits configurable by environment variable
- Provider rewards paid in internal credits only

### Model registry

- Admin-created models
- Model public slug, display name, family, modality, context length, pricing, status
- Model version records
- Ollama runtime mapping
- Minimum VRAM requirement
- Quantization metadata
- Commercial/license notes
- Approval status

### Provider system

- Provider owner creates a provider in dashboard/API
- System generates provider token once
- Provider token is stored hashed server-side
- Provider node uses outbound WebSocket
- Provider sends hello, hardware info, heartbeat, model list, benchmark info
- Provider can be approved/unapproved by admin
- Provider can be disabled by owner
- Offline detection after heartbeat timeout

### Inference API

- `GET /v1/models`
- `POST /v1/chat/completions`
- OpenAI-compatible request and response shape where practical
- Non-streaming chat completions required
- Streaming can return a clear `streaming_not_implemented` error in V1
- Request id included in response headers and errors

### Router

- Select healthy approved provider
- Check model support
- Check minimum credits
- Score by availability, latency, success rate, queue depth, VRAM suitability, and provider trust level
- Fallback to other provider if selected provider fails before job starts
- No silent paid external fallback by default

### Dashboard

- Login/register
- User overview
- Projects
- API keys
- Credits ledger
- Usage logs
- Provider setup page
- Provider status page
- Model catalog
- Admin pages for provider/model/usage/wallet review

### Admin

- Approve/reject providers
- Approve/reject provider model advertisements
- Create/update models
- Set model price
- Pause a model
- Disable provider
- View usage
- Create manual wallet adjustment with reason
- View job failures

## V1 explicit non-goals

### No fiat payout

V1 has no real-money provider payments, no withdrawal button, no invoices, no KYC, no crypto, and no promise of future cash conversion. The UI must clearly say:

> Credits are internal platform credits. They are not money, cannot be sold, cannot be withdrawn, and have no cash value in V1.

### No funded 70B+ hosting requirement

The maintainer has no initial budget for dedicated 70B+ model hosting. V1 must work without renting GPUs. 70B+ access can be:

- deferred to V2/V3, or
- added as an optional admin-configured external connector that is disabled by default.

### No random distributed 70B tensor parallelism

Do not split one large model across many random home providers in V1. That is not part of the first release.

### No arbitrary code execution on provider machines

The server must only send model inference jobs, model pull instructions, and health checks. It must not send shell commands or untrusted code to providers.

### No prompt privacy guarantee for community providers

V1 may send prompts to semi-trusted community machines. The product must warn users. Sensitive/business/private data should not be sent to community provider models in V1.

## V1 success criteria

V1 succeeds when:

- The system can run locally with Docker Compose and one local provider node.
- A developer can call a model through an API key.
- A provider can earn internal credits after serving a job.
- The usage and credit movement are visible.
- The docs allow a coding agent to implement the backbone without product guesswork.
