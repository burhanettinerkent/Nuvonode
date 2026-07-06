package main

import (
	"context"
	"log"
	"time"

	"github.com/nuvonode/nuvonode/apps/api/internal/config"
	"github.com/nuvonode/nuvonode/apps/api/internal/database"
	"github.com/nuvonode/nuvonode/apps/api/internal/handler"
	"github.com/nuvonode/nuvonode/apps/api/internal/observability"
	"github.com/nuvonode/nuvonode/apps/api/internal/repository"
	"github.com/nuvonode/nuvonode/apps/api/internal/router"
	"github.com/nuvonode/nuvonode/apps/api/internal/service"
	"github.com/nuvonode/nuvonode/apps/api/internal/ws"
	"go.uber.org/zap"
)

func main() {
	ctx := context.Background()
	cfg := config.Load()
	logger, err := observability.NewLogger(cfg.AppEnv)
	if err != nil {
		log.Fatal(err)
	}
	defer logger.Sync()
	db, err := database.NewPostgres(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("postgres", zapError(err))
	}
	defer db.Close()
	rdb, err := database.NewRedis(ctx, cfg.RedisURL)
	if err != nil {
		logger.Fatal("redis", zapError(err))
	}
	defer rdb.Close()
	store := repository.NewStore(db)
	svc := service.New(cfg, store)
	go sweepProviderTimeouts(ctx, svc, cfg.ProviderHeartbeatInterval)
	hub := ws.NewHub()
	h := handler.New(cfg, db, rdb, svc, hub)
	app := router.New(cfg, logger, rdb, h, svc)
	if err := app.Listen(cfg.HTTPAddr); err != nil {
		logger.Fatal("listen", zapError(err))
	}
}

func sweepProviderTimeouts(ctx context.Context, svc *service.Services, interval time.Duration) {
	if interval <= 0 {
		interval = 15 * time.Second
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case now := <-ticker.C:
			_, _ = svc.Provider.MarkOfflineTimedOut(ctx, now)
		}
	}
}

func zapError(err error) zap.Field { return zap.Error(err) }
