# 03 — Repository Structure

Implement the repository as a monorepo. Use this structure unless a file is impossible in the selected framework.

```txt
nuvonode/
  README.md
  CLAUDE.md
  LICENSE
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  SECURITY.md
  Makefile
  docker-compose.yml
  .env.example
  .gitignore

  apps/
    api/
      cmd/
        api/
          main.go
      internal/
        config/
          config.go
        database/
          postgres.go
          redis.go
          tx.go
        httpx/
          errors.go
          middleware.go
          response.go
        auth/
          password.go
          jwt.go
          apikey.go
          provider_token.go
        domain/
          user.go
          project.go
          wallet.go
          model.go
          provider.go
          job.go
          usage.go
        repository/
          users.go
          projects.go
          api_keys.go
          wallets.go
          models.go
          providers.go
          jobs.go
          usage.go
          admin.go
        service/
          auth_service.go
          wallet_service.go
          model_service.go
          provider_service.go
          routing_service.go
          inference_service.go
          usage_service.go
          admin_service.go
        handler/
          health_handler.go
          auth_handler.go
          project_handler.go
          api_key_handler.go
          wallet_handler.go
          model_handler.go
          provider_handler.go
          openai_handler.go
          admin_handler.go
          ws_provider_handler.go
        router/
          router.go
        ws/
          hub.go
          connection.go
          protocol.go
        metering/
          tokenizer.go
          estimator.go
          pricing.go
        observability/
          logger.go
          metrics.go
      tests/
        integration/
          chat_completion_test.go
          provider_ws_test.go
      go.mod
      go.sum

    provider-node/
      cmd/
        provider-node/
          main.go
      internal/
        config/
          config.go
        ollama/
          client.go
          types.go
        hardware/
          detect.go
          benchmark.go
        protocol/
          messages.go
        node/
          client.go
          serve.go
          doctor.go
          init.go
        logging/
          logger.go
      examples/
        config.example.yaml
      go.mod
      go.sum

    web/
      app/
        layout.tsx
        page.tsx
        login/page.tsx
        register/page.tsx
        dashboard/page.tsx
        dashboard/projects/page.tsx
        dashboard/api-keys/page.tsx
        dashboard/credits/page.tsx
        dashboard/usage/page.tsx
        dashboard/models/page.tsx
        dashboard/providers/page.tsx
        dashboard/providers/new/page.tsx
        dashboard/providers/[id]/page.tsx
        admin/page.tsx
        admin/providers/page.tsx
        admin/models/page.tsx
        admin/usage/page.tsx
        admin/wallets/page.tsx
        admin/jobs/page.tsx
      components/
        AppShell.tsx
        DataTable.tsx
        EmptyState.tsx
        FormField.tsx
        CopyBox.tsx
        StatusBadge.tsx
        CreditBalance.tsx
        ProviderSetupCommand.tsx
      lib/
        api.ts
        auth.ts
        types.ts
        format.ts
      package.json
      tsconfig.json

  database/
    migrations/
      000001_init.up.sql
      000001_init.down.sql
    seeds/
      000001_seed_models.sql
    schema_v1.sql

  api/
    openapi.yaml

  docs/
    ...

  examples/
    curl/
      00_register.sh
      01_login.sh
      02_create_project.sh
      03_create_api_key.sh
      04_create_provider.sh
      05_chat_completion.sh
    provider-config/
      config.example.yaml
```

## Naming conventions

- Public IDs use prefixed strings: `usr_`, `prj_`, `key_`, `mdl_`, `prv_`, `job_`, `use_`, `led_`.
- Database primary keys may be UUIDs. Public IDs are separate unique text columns.
- Timestamps use UTC `timestamptz`.
- Soft delete columns use `deleted_at timestamptz`.
- Status values use lowercase snake_case.

## Go package rules

- Handlers do not talk directly to repositories.
- Services hold business logic.
- Repositories hold SQL.
- Wallet ledger operations must go through `wallet_service` only.
- Routing decisions must go through `routing_service` only.
- Provider WebSocket messages must use typed structs from `ws/protocol.go`.

## Frontend rules

- Use functional pages first; styling can be basic.
- Every dashboard table must show loading, empty, and error states.
- Every destructive action needs a confirmation prompt.
- API keys and provider tokens are shown only once after creation.
- The UI must display the V1 credit disclaimer on credits and provider earnings screens.
