# 20 — Git Setup Commands

Do not share GitHub personal access tokens in chat. Push locally from your machine.

## Create repo locally

```bash
cd nuvonode-mesh-docs-v90
git init
git add .
git commit -m "Initial Nuvonode Mesh V1 documentation"
```

## Add remote

Replace `<owner>` with your GitHub username or organization.

```bash
git remote add origin https://github.com/<owner>/nuvonode.git
git branch -M main
git push -u origin main
```

## Recommended GitHub settings

Repository description:

```txt
Open-source AI inference mesh with OpenAI-compatible API, community GPU providers, Ollama provider node, and internal credit rewards.
```

Website:

```txt
https://nuvonode.com
```

Topics:

```txt
ai,llm,inference,gpu,ollama,open-source,openai-compatible,go,postgresql,redis,websocket,model-router,ai-infrastructure,community,provider-node
```

## After code implementation starts

Create branches by milestone:

```bash
git checkout -b milestone-01-backend-foundation
git checkout -b milestone-02-models-wallets-admin
git checkout -b milestone-03-provider-node-ws
git checkout -b milestone-04-router-inference
git checkout -b milestone-05-dashboard
git checkout -b milestone-06-tests-hardening
```
