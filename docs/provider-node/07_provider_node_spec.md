# 07 — Provider Node Spec

## Purpose

`nuvonode-provider` lets a GPU owner connect their machine to the Nuvonode Mesh without opening inbound ports.

## V1 runtime

V1 only requires Ollama.

Provider node must talk to Ollama through:

```txt
http://localhost:11434
```

Configurable with:

```yaml
ollama_url: http://localhost:11434
```

## Commands

### init

```bash
nuvonode-provider init \
  --server http://localhost:8080 \
  --token pvn_provider_... \
  --name "Home RTX"
```

Creates config file:

Linux/macOS:

```txt
~/.nuvonode-provider/config.yaml
```

Windows:

```txt
%USERPROFILE%\.nuvonode-provider\config.yaml
```

### doctor

```bash
nuvonode-provider doctor
```

Checks:

- Config exists
- Server reachable
- Token format valid
- Ollama reachable
- Ollama model list readable
- GPU info detectable if possible
- WebSocket connection test successful

Output example:

```txt
Nuvonode Provider Doctor
[ok] config loaded
[ok] server reachable: http://localhost:8080
[ok] ollama reachable: http://localhost:11434
[ok] models found: 2
[warn] GPU VRAM detection not available on this OS
[ok] websocket auth accepted
```

### serve

```bash
nuvonode-provider serve
```

Behavior:

- Connect to `/api/provider/ws`
- Send hello
- Send hardware report
- Send model advertisements
- Send heartbeat every 15 seconds
- Wait for job requests
- Execute one job at a time by default
- Return job result or job error
- Reconnect with exponential backoff

### models

```bash
nuvonode-provider models
```

Lists local Ollama models and whether they match approved Nuvonode model versions.

### pull

Manual model pull helper:

```bash
nuvonode-provider pull qwen-7b-instruct
```

This maps Nuvonode model slug to configured Ollama runtime model name. If mapping is unknown, show error.

## Config file

```yaml
server_url: "http://localhost:8080"
provider_token: "pvn_provider_..."
provider_name: "Home RTX"
instance_key: "auto-generated-stable-machine-id"
ollama_url: "http://localhost:11434"
allow_auto_model_pull: false
max_concurrent_jobs: 1
heartbeat_interval_seconds: 15
log_level: "info"
allowed_model_slugs:
  - "qwen-7b-instruct"
```

## Hardware detection

Collect best-effort fields:

```json
{
  "hostname": "desktop",
  "os": "windows",
  "arch": "amd64",
  "cpu_model": "...",
  "ram_mb": 32768,
  "gpus": [
    {
      "name": "NVIDIA RTX 4090",
      "vram_mb": 24576,
      "driver": "...",
      "cuda_version": "..."
    }
  ]
}
```

If GPU detection fails, still allow provider connection but do not auto-approve for models requiring VRAM.

## Ollama adapter

Provider converts OpenAI-style messages into Ollama chat request.

Expected Ollama-like request structure internally:

```json
{
  "model": "runtime_model_name",
  "messages": [
    {"role":"system","content":"..."},
    {"role":"user","content":"..."}
  ],
  "stream": false,
  "options": {
    "temperature": 0.7,
    "num_predict": 256
  }
}
```

Provider returns:

```json
{
  "job_id": "job_...",
  "content": "...",
  "finish_reason": "stop",
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150,
    "source": "runtime_reported"
  },
  "latency_ms": 2300
}
```

If Ollama does not provide token counts, provider returns null counts and server estimates.

## Auto model pull

V1 supports manual pull. Auto pull is allowed only when all are true:

- Provider owner sets `allow_auto_model_pull=true`.
- Admin allows auto pull globally.
- Model version has runtime `ollama`.
- Model is approved.
- Provider hardware meets minimum VRAM.

Server may send `model_pull_request`. Provider must not execute arbitrary commands; it only calls Ollama pull API or documented Ollama CLI equivalent.

## Safety rules

Provider node must never:

- Execute shell commands received from server
- Upload local files
- Send environment variables
- Send SSH keys or tokens except provider token during auth
- Run models not approved by local config if `allowed_model_slugs` is set

## Reconnect rules

- First retry after 1 second
- Then 2, 4, 8, 16, 30 seconds max
- Add jitter
- Keep running until user stops process

## Provider status labels

- `offline`: no heartbeat within timeout
- `online`: connected and available
- `busy`: running job
- `draining`: connected but not accepting new jobs
- `disabled`: disabled server-side
