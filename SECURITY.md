# Security Policy

## Reporting vulnerabilities

Please report security vulnerabilities privately to the repository maintainer. Do not open a public issue for vulnerabilities, exploit details, leaked secrets, or abuse paths.

Include:

- Affected component
- Steps to reproduce
- Impact
- Suggested fix, if known
- Whether any token, key, or user data may be exposed

## V1 trust model

Nuvonode Mesh V1 routes prompts to community provider machines. Provider nodes are semi-trusted.

Do not send the following to community-routed models:

- Secrets or credentials
- Private keys or access tokens
- Regulated data
- Confidential business data
- Private customer records
- Sensitive personal data

## Platform security rules

- API keys must be stored hashed, never plaintext.
- Provider tokens must be stored hashed, never plaintext.
- Authorization headers must not be logged.
- Prompt and completion body logging is disabled by default.
- Provider nodes must never receive platform secrets.
- Provider nodes must not execute arbitrary commands from the API.
- Provider-reported token counts must be validated server-side before settlement.
- Every credit movement must be recorded in `wallet_ledger` in the same transaction as wallet balance updates.

## Provider-node security boundary

Provider-node should:

- Connect outbound to the API over WebSocket.
- Use a local provider token.
- Call local Ollama HTTP APIs only.
- Report health, hardware, and model advertisements.
- Execute only approved job requests for approved model operations.

Provider-node should not:

- Open inbound ports for Nuvonode.
- Execute shell commands from server messages.
- Expose local files.
- Send provider host secrets to the platform.

## Supported versions

V1 is pre-release. Security fixes target the current `main` branch until release branches exist.
