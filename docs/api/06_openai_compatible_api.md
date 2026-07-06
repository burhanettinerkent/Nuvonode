# 06 — OpenAI-Compatible API

## Base URL

Local:

```txt
http://localhost:8080/v1
```

Production example:

```txt
https://api.nuvonode.com/v1
```

## Auth

```txt
Authorization: Bearer pvn_live_...
```

## GET /v1/models

Response:

```json
{
  "object": "list",
  "data": [
    {
      "id": "qwen-7b-instruct",
      "object": "model",
      "created": 1760000000,
      "owned_by": "nuvonode-community"
    }
  ]
}
```

Only return active public models. Do not return paused/deprecated models unless admin debug mode is used.

## POST /v1/chat/completions

### Required V1 fields

```json
{
  "model": "qwen-7b-instruct",
  "messages": [
    {"role": "system", "content": "You are helpful."},
    {"role": "user", "content": "Say hello in Turkish."}
  ],
  "max_tokens": 256,
  "temperature": 0.7,
  "stream": false
}
```

### Supported message roles

- `system`
- `user`
- `assistant`

Ignore unsupported fields safely where possible, but reject clearly invalid request shapes.

### V1 response

```json
{
  "id": "chatcmpl_job_abc123",
  "object": "chat.completion",
  "created": 1760000000,
  "model": "qwen-7b-instruct",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Merhaba! Size nasıl yardımcı olabilirim?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 18,
    "completion_tokens": 12,
    "total_tokens": 30
  }
}
```

### Headers

Response headers:

```txt
x-request-id: req_...
x-nuvonode-job-id: job_...
x-nuvonode-provider-id: prv_...   # omit if not available
```

### Streaming

If `stream=true` in V1:

Return HTTP 400:

```json
{
  "error": {
    "code": "streaming_not_implemented",
    "message": "Streaming chat completions are planned for V1.1. Send stream=false for V1.",
    "request_id": "req_..."
  }
}
```

## Cost precheck

Before dispatch:

1. Estimate input tokens from messages.
2. Use `max_tokens` or model default.
3. Estimate max possible cost.
4. Require available wallet balance >= estimated cost.

## Privacy notice

Dashboard and docs must tell users:

> In V1, community provider models may process prompts on machines owned by community providers. Do not send secrets, personal data, confidential business data, or regulated data to community-routed models.

## Error shape

All errors:

```json
{
  "error": {
    "code": "model_unavailable",
    "message": "No approved online provider is currently available for this model.",
    "request_id": "req_..."
  }
}
```

## Curl example

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer $NUVONODE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-7b-instruct",
    "messages": [
      {"role":"user","content":"Merhaba, kendini tek cümleyle tanıt."}
    ],
    "max_tokens": 128,
    "temperature": 0.7,
    "stream": false
  }'
```
