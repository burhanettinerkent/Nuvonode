.PHONY: dev-db migrate-up migrate-down seed api provider web test fmt lint

dev-db:
	docker compose up -d

migrate-up:
	psql "$${DATABASE_URL:-postgres://nuvonode:nuvonode@localhost:55432/nuvonode?sslmode=disable}" -f database/migrations/000001_init.up.sql

migrate-down:
	psql "$${DATABASE_URL:-postgres://nuvonode:nuvonode@localhost:55432/nuvonode?sslmode=disable}" -f database/migrations/000001_init.down.sql

seed:
	psql "$${DATABASE_URL:-postgres://nuvonode:nuvonode@localhost:55432/nuvonode?sslmode=disable}" -f database/seeds/000001_seed_models.sql

api:
	cd apps/api && go run ./cmd/api

provider:
	cd apps/provider-node && go run ./cmd/provider-node serve

web:
	cd apps/web && npm run dev

test:
	cd apps/api && go test ./...
	cd apps/provider-node && go test ./...

fmt:
	gofmt -w apps/api apps/provider-node || true
	cd apps/web && npm run format || true

lint:
	cd apps/api && go vet ./...
	cd apps/provider-node && go vet ./...
