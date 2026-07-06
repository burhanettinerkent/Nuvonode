# 00 — Vision and Scope

## One-sentence vision

Nuvonode Mesh is an open-source AI infrastructure platform where developers access open AI models through one API, and GPU owners earn internal credits by safely serving model inference jobs from their own machines.

## Why this should exist

Small developers often need cheaper and simpler access to AI models. GPU owners often have hardware sitting idle. Nuvonode connects both sides with a transparent internal credit system and a provider-node architecture that can start small and grow with community contributions.

## Target users

### API users

- Solo developers
- Small AI SaaS builders
- Students and hobbyists
- Open-source maintainers
- Teams experimenting with local/open models

They need:

- One API key
- One endpoint style
- Cheap model usage
- Simple integration
- Usage tracking
- Model choice

### Provider users

- People with RTX 3060/3090/4090/5090-class machines
- People with workstation GPUs
- Developers already running Ollama locally
- Community members who want to earn internal credits

They need:

- Easy setup
- Clear GPU compatibility checks
- Visible credit earnings
- No port forwarding
- No unsafe arbitrary code execution
- Control over which models run locally

### Admin/operators

- Repository maintainer
- Community moderators
- Infrastructure maintainers

They need:

- Provider approval
- Model approval
- Abuse controls
- Usage audit
- Wallet correction tools
- Routing visibility
- System health

## Product shape

Nuvonode has three public surfaces:

1. **Developer API** — OpenAI-compatible API for model inference.
2. **Provider node** — Local CLI app that connects a GPU machine to the mesh.
3. **Dashboard** — Web UI for users, providers, and admins.

## Strategic direction

V1 builds a reliable working backbone. V2 expands trust, privacy, model types, and routing. V3 may introduce managed providers, payout mechanisms, marketplace logic, and larger models if funding/community demand exists.

## The practical starting point

Start with small and mid-size models. Do not attempt distributed 70B+ execution across random home machines in V1. That is a separate research-grade engineering problem involving networking, tensor parallelism, uptime, trust, and latency.

## Domain/brand recommendation

Use the domain as the umbrella brand:

- Brand: `Nuvonode`
- Project: `Nuvonode Mesh`
- Repo: `nuvonode`
- API domain: `api.nuvonode.com`
- App domain: `app.nuvonode.com`
- Docs domain: `docs.nuvonode.com`

Nuvonode alone sounds broad, but `Nuvonode Mesh` makes the AI infrastructure meaning clear.
