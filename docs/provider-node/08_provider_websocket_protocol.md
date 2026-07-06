# 08 — Provider WebSocket Protocol

## Endpoint

```txt
GET /api/provider/ws
Authorization: Bearer pvn_provider_...
```

The provider token authenticates the provider. The token is not sent in message bodies.

## Message envelope

All messages use this envelope:

```json
{
  "type": "provider.hello",
  "message_id": "msg_...",
  "sent_at": "2026-01-01T00:00:00Z",
  "payload": {}
}
```

## Provider -> Server messages

### provider.hello

Sent immediately after WebSocket connect.

```json
{
  "type": "provider.hello",
  "message_id": "msg_1",
  "sent_at": "...",
  "payload": {
    "instance_key": "stable-machine-id",
    "app_version": "0.1.0",
    "hostname": "desktop",
    "os": "windows",
    "arch": "amd64",
    "ollama_url": "http://localhost:11434"
  }
}
```

### provider.hardware_report

```json
{
  "type": "provider.hardware_report",
  "payload": {
    "cpu_model": "...",
    "ram_mb": 32768,
    "gpus": [
      {"name":"NVIDIA RTX 4090", "vram_mb":24576, "driver":"..."}
    ],
    "raw": {}
  }
}
```

### provider.model_list

```json
{
  "type": "provider.model_list",
  "payload": {
    "runtime": "ollama",
    "models": [
      {
        "runtime_model_name": "qwen-7b-instruct",
        "digest": "sha256:...",
        "size_bytes": 5000000000
      }
    ]
  }
}
```

Server creates or updates provider model advertisements. Unknown runtime model names remain pending until admin maps them to Nuvonode models.

### provider.heartbeat

Sent every 15 seconds.

```json
{
  "type": "provider.heartbeat",
  "payload": {
    "status": "online",
    "current_job_id": null,
    "queue_depth": 0,
    "gpu_utilization_percent": 20,
    "gpu_temperature_c": 55,
    "available_vram_mb": 18000
  }
}
```

### provider.job_started

```json
{
  "type": "provider.job_started",
  "payload": {
    "job_id": "job_..."
  }
}
```

### provider.job_result

```json
{
  "type": "provider.job_result",
  "payload": {
    "job_id": "job_...",
    "content": "Assistant response",
    "finish_reason": "stop",
    "usage": {
      "prompt_tokens": 100,
      "completion_tokens": 50,
      "total_tokens": 150,
      "source": "runtime_reported"
    },
    "latency_ms": 2200
  }
}
```

### provider.job_error

```json
{
  "type": "provider.job_error",
  "payload": {
    "job_id": "job_...",
    "error_code": "ollama_model_not_found",
    "error_message": "Model is not installed locally."
  }
}
```

## Server -> Provider messages

### server.hello_ack

```json
{
  "type": "server.hello_ack",
  "payload": {
    "provider_id": "prv_...",
    "instance_id": "pin_...",
    "approval_status": "approved",
    "server_time": "..."
  }
}
```

### server.job_request

```json
{
  "type": "server.job_request",
  "message_id": "msg_...",
  "payload": {
    "job_id": "job_...",
    "model_slug": "qwen-7b-instruct",
    "runtime": "ollama",
    "runtime_model_name": "qwen-7b-instruct",
    "messages": [
      {"role":"user","content":"Hello"}
    ],
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 256,
      "top_p": 1.0
    },
    "timeout_seconds": 120
  }
}
```

### server.model_pull_request

Optional; disabled unless allowed.

```json
{
  "type": "server.model_pull_request",
  "payload": {
    "model_slug": "qwen-7b-instruct",
    "runtime_model_name": "qwen-7b-instruct"
  }
}
```

### server.drain

```json
{
  "type": "server.drain",
  "payload": {
    "reason": "maintenance"
  }
}
```

## Idempotency

Provider must ignore duplicate `server.job_request` for already completed `job_id` and re-send previous result if available in memory. Server must also protect against duplicate settlement by enforcing unique `usage_records.job_id`.

## Heartbeat timeout

If no heartbeat for `PROVIDER_HEARTBEAT_TIMEOUT_SECONDS`, server marks instance offline and stops routing new jobs to it.

## Backpressure

Provider may send heartbeat status `busy` or `draining`. Router must not send new jobs when provider is not `online`.
