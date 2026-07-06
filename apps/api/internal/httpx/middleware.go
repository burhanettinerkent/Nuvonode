package httpx

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/nuvonode/nuvonode/apps/api/internal/auth"
	"github.com/nuvonode/nuvonode/apps/api/internal/domain"
	"github.com/nuvonode/nuvonode/apps/api/internal/service"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type AuthContext struct{ User domain.User }

func RequestIDMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := "req_" + auth.PublicID("id")
		c.Locals("request_id", id)
		c.Set("x-request-id", id)
		return c.Next()
	}
}

func LoggingMiddleware(log *zap.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		log.Info("http_request", zap.String("request_id", RequestID(c)), zap.String("method", c.Method()), zap.String("path", c.Path()), zap.Int("status", c.Response().StatusCode()), zap.Duration("duration", time.Since(start)))
		return err
	}
}

func RateLimitMiddleware(rdb *redis.Client, perMinute int) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if perMinute <= 0 || rdb == nil {
			return c.Next()
		}
		key := "rate:" + c.IP() + ":" + c.Method() + ":" + c.Path() + ":" + time.Now().UTC().Format("200601021504")
		ctx, cancel := context.WithTimeout(c.Context(), time.Second)
		defer cancel()
		n, err := rdb.Incr(ctx, key).Result()
		if err == nil && n == 1 {
			_ = rdb.Expire(ctx, key, time.Minute).Err()
		}
		if err == nil && n > int64(perMinute) {
			return Error(c, fiber.StatusTooManyRequests, "rate_limited", "Too many requests.")
		}
		return c.Next()
	}
}

func DashboardAuth(s *service.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := bearer(c)
		if token == "" {
			return Error(c, fiber.StatusUnauthorized, "unauthorized", "Missing bearer token.")
		}
		u, err := s.UserFromJWT(c.Context(), token)
		if err != nil {
			return Handle(c, err)
		}
		c.Locals("user", u)
		return c.Next()
	}
}

func bearer(c *fiber.Ctx) string {
	h := c.Get("Authorization")
	if !strings.HasPrefix(h, "Bearer ") {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(h, "Bearer "))
}

func User(c *fiber.Ctx) domain.User { u, _ := c.Locals("user").(domain.User); return u }
func Bearer(c *fiber.Ctx) string    { return bearer(c) }
