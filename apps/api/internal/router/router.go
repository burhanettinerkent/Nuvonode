package router

import (
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/nuvonode/nuvonode/apps/api/internal/config"
	"github.com/nuvonode/nuvonode/apps/api/internal/handler"
	"github.com/nuvonode/nuvonode/apps/api/internal/httpx"
	"github.com/nuvonode/nuvonode/apps/api/internal/service"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

func New(cfg config.Config, log *zap.Logger, rdb *redis.Client, h *handler.Handler, svc *service.Services) *fiber.App {
	app := fiber.New(fiber.Config{DisableStartupMessage: true})
	app.Use(httpx.RequestIDMiddleware())
	app.Use(httpx.LoggingMiddleware(log))
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{AllowOrigins: cfg.PublicWebBaseURL, AllowHeaders: "Authorization, Content-Type, Idempotency-Key", AllowMethods: "GET,POST,PATCH,DELETE,OPTIONS"}))

	app.Get("/health", h.Health)
	app.Post("/api/auth/register", httpx.RateLimitMiddleware(rdb, 5), h.Register)
	app.Post("/api/auth/login", httpx.RateLimitMiddleware(rdb, 10), h.Login)
	app.Get("/api/provider/ws", websocket.New(h.ProviderWS))

	authenticated := app.Group("/api", httpx.DashboardAuth(svc.Auth))
	authenticated.Get("/me", h.Me)
	authenticated.Get("/projects", h.ListProjects)
	authenticated.Post("/projects", h.CreateProject)
	authenticated.Get("/projects/:project_id/api-keys", h.ListAPIKeys)
	authenticated.Post("/projects/:project_id/api-keys", h.CreateAPIKey)
	authenticated.Delete("/projects/:project_id/api-keys/:key_id", h.RevokeAPIKey)
	authenticated.Get("/wallet", h.Wallet)
	authenticated.Get("/wallet/ledger", h.Ledger)
	authenticated.Get("/usage", h.Usage)
	authenticated.Get("/models", h.Models)
	authenticated.Get("/providers", h.Providers)
	authenticated.Post("/providers", h.CreateProvider)
	authenticated.Get("/admin/jobs", h.AdminJobs)
	authenticated.Get("/admin/usage", h.AdminUsage)
	authenticated.Post("/admin/wallets/:user_id/adjust", h.AdjustWallet)
	authenticated.Get("/admin/models", h.AdminModels)
	authenticated.Post("/admin/models", h.CreateAdminModel)
	authenticated.Patch("/admin/models/:model_id", h.UpdateAdminModel)
	authenticated.Post("/admin/models/:model_id/pause", h.PauseAdminModel)
	authenticated.Get("/admin/providers", h.AdminProviders)
	authenticated.Post("/admin/providers/:provider_id/approve", h.ApproveProvider)
	authenticated.Post("/admin/providers/:provider_id/reject", h.RejectProvider)
	authenticated.Post("/admin/providers/:provider_id/disable", h.DisableProvider)
	authenticated.Get("/admin/provider-models/pending", h.PendingProviderModels)
	authenticated.Post("/admin/provider-models/:id/approve", h.ApproveProviderModel)
	authenticated.Post("/admin/provider-models/:id/reject", h.RejectProviderModel)
	authenticated.Get("/admin/audit-log", h.AdminAuditLog)

	app.Get("/v1/models", h.OpenAIModels)
	app.Post("/v1/chat/completions", httpx.RateLimitMiddleware(rdb, cfg.DefaultRateLimitPerMinute), h.ChatCompletions)
	return app
}
