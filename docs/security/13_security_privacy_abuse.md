# 13 — Security, Privacy, and Abuse

## V1 trust statement

Nuvonode Mesh V1 is a community inference network. Provider nodes may be owned by community members. Do not treat V1 community routing as private enterprise inference.

## Required user-facing warning

Show this warning on dashboard and docs:

> Community-routed prompts may be processed on machines owned by community providers. Do not send secrets, passwords, API keys, personal data, medical/legal/financial records, confidential business data, or regulated data to community-routed models.

## Secrets handling

Never log:

- Authorization headers
- API keys
- Provider tokens
- JWTs
- Passwords
- Environment variables

Store:

- API key hash only
- Provider token hash only
- Password hash only

## Prompt logging

Default:

```env
LOG_PROMPTS=false
```

When false:

- Do not store request messages.
- Do not store completion text.
- Store only metadata: token counts, model, cost, latency, status.

## Provider risk

A provider could:

- See prompts while processing them
- Return low-quality output
- Return manipulated token counts
- Go offline mid-job
- Attempt to farm credits

V1 mitigations:

- Approval required
- Token validation by server estimate
- Heartbeat timeout
- Job timeout
- Trust score
- Admin moderation
- Rate limits
- Internal credits only

## API user abuse

A user could:

- Create many accounts to farm free credits
- Send spam prompts
- Send illegal content
- Try to overload providers

V1 mitigations:

- Rate limits per IP/API key/user
- Starting credits configurable and low
- Admin disable user/project
- Usage visibility
- Abuse reporting endpoint can be added later

## Provider-node local safety

Provider node must:

- Only connect outbound
- Not expose local HTTP server publicly by default
- Not execute arbitrary server commands
- Not upload local files
- Not read local folders
- Not send env vars
- Only call Ollama for approved model operations

## TLS

Production must use HTTPS/WSS.

Local dev can use HTTP/WS.

## Rate limits

Minimum V1 rate limits:

- Register: 5/hour/IP
- Login: 10/min/IP
- API key chat completions: 30/min/project by default
- Provider WebSocket connection attempts: 20/min/provider

Use Redis counters.

## Content moderation

V1 does not need full AI safety moderation, but must allow:

- Admin disable abusive project
- Admin view metadata of suspicious usage
- Admin block model/provider

Do not market the platform for illegal or harmful activity.

## Dependency security

- Keep dependency list minimal.
- Use Dependabot or similar GitHub alerts.
- Do not commit `.env`.
- Provide `.env.example` only.

## Responsible disclosure

Use `SECURITY.md` for vulnerability reporting.
