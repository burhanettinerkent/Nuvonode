package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	AppEnv                      string
	HTTPAddr                    string
	PublicAPIBaseURL            string
	PublicWebBaseURL            string
	DatabaseURL                 string
	RedisURL                    string
	JWTSecret                   string
	APIKeyPepper                string
	ProviderTokenPepper         string
	StartingFreeCredits         int64
	CreditScale                 int64
	ProviderHeartbeatTimeout    time.Duration
	ProviderHeartbeatInterval   time.Duration
	JobTimeout                  time.Duration
	ExternalConnectorsEnabled   bool
	AllowDevAutoApproveProvider bool
	BootstrapFirstUserAdmin     bool
	LogPrompts                  bool
	DefaultRateLimitPerMinute   int
}

func Load() Config {
	return Config{
		AppEnv:                      env("APP_ENV", "development"),
		HTTPAddr:                    env("HTTP_ADDR", ":8080"),
		PublicAPIBaseURL:            env("PUBLIC_API_BASE_URL", "http://localhost:8080"),
		PublicWebBaseURL:            env("PUBLIC_WEB_BASE_URL", "http://localhost:3000"),
		DatabaseURL:                 env("DATABASE_URL", "postgres://nuvonode:nuvonode@localhost:5432/nuvonode?sslmode=disable"),
		RedisURL:                    env("REDIS_URL", "redis://localhost:6379/0"),
		JWTSecret:                   env("JWT_SECRET", "change_me_dev_only"),
		APIKeyPepper:                env("API_KEY_PEPPER", "change_me_dev_only"),
		ProviderTokenPepper:         env("PROVIDER_TOKEN_PEPPER", "change_me_dev_only"),
		StartingFreeCredits:         envInt64("STARTING_FREE_CREDITS", 10000),
		CreditScale:                 envInt64("CREDIT_SCALE", 1000000),
		ProviderHeartbeatTimeout:    time.Duration(envInt("PROVIDER_HEARTBEAT_TIMEOUT_SECONDS", 45)) * time.Second,
		ProviderHeartbeatInterval:   time.Duration(envInt("PROVIDER_HEARTBEAT_INTERVAL_SECONDS", 15)) * time.Second,
		JobTimeout:                  time.Duration(envInt("JOB_TIMEOUT_SECONDS", 120)) * time.Second,
		ExternalConnectorsEnabled:   envBool("EXTERNAL_CONNECTORS_ENABLED", false),
		AllowDevAutoApproveProvider: envBool("ALLOW_DEV_AUTO_APPROVE_PROVIDER", true),
		BootstrapFirstUserAdmin:     envBool("BOOTSTRAP_FIRST_USER_ADMIN", true),
		LogPrompts:                  envBool("LOG_PROMPTS", false),
		DefaultRateLimitPerMinute:   envInt("DEFAULT_RATE_LIMIT_PER_MINUTE", 30),
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	v, err := strconv.Atoi(env(key, ""))
	if err != nil {
		return fallback
	}
	return v
}

func envInt64(key string, fallback int64) int64 {
	v, err := strconv.ParseInt(env(key, ""), 10, 64)
	if err != nil {
		return fallback
	}
	return v
}

func envBool(key string, fallback bool) bool {
	v := env(key, "")
	if v == "" {
		return fallback
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}
