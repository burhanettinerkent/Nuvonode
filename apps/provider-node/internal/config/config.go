package config

import (
	"bufio"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type Config struct {
	ServerURL                string
	ProviderToken            string
	ProviderName             string
	InstanceKey              string
	OllamaURL                string
	AllowAutoModelPull       bool
	MaxConcurrentJobs        int
	HeartbeatIntervalSeconds int
	LogLevel                 string
	AllowedModelSlugs        []string
}

func DefaultPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".nuvonode-provider", "config.yaml"), nil
}

func Default() Config {
	return Config{ServerURL: "http://localhost:8080", OllamaURL: "http://localhost:11434", MaxConcurrentJobs: 1, HeartbeatIntervalSeconds: 15, LogLevel: "info"}
}

func Load(path string) (Config, error) {
	cfg := Default()
	f, err := os.Open(path)
	if err != nil {
		return cfg, err
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	inAllowed := false
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if inAllowed && strings.HasPrefix(line, "-") {
			cfg.AllowedModelSlugs = append(cfg.AllowedModelSlugs, strings.Trim(strings.TrimSpace(strings.TrimPrefix(line, "-")), `"'`))
			continue
		}
		inAllowed = false
		key, val, ok := strings.Cut(line, ":")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		val = strings.Trim(strings.TrimSpace(val), `"'`)
		if key == "allowed_model_slugs" {
			inAllowed = true
			continue
		}
		switch key {
		case "server_url":
			cfg.ServerURL = val
		case "provider_token":
			cfg.ProviderToken = val
		case "provider_name":
			cfg.ProviderName = val
		case "instance_key":
			cfg.InstanceKey = val
		case "ollama_url":
			cfg.OllamaURL = val
		case "allow_auto_model_pull":
			cfg.AllowAutoModelPull, _ = strconv.ParseBool(val)
		case "max_concurrent_jobs":
			cfg.MaxConcurrentJobs, _ = strconv.Atoi(val)
		case "heartbeat_interval_seconds":
			cfg.HeartbeatIntervalSeconds, _ = strconv.Atoi(val)
		case "log_level":
			cfg.LogLevel = val
		}
	}
	if err := scanner.Err(); err != nil {
		return cfg, err
	}
	return cfg, nil
}

func Write(path string, cfg Config) error {
	if cfg.InstanceKey == "" {
		cfg.InstanceKey = "inst_" + token(12)
	}
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}
	var content strings.Builder
	content.WriteString(fmt.Sprintf("server_url: %q\nprovider_token: %q\nprovider_name: %q\ninstance_key: %q\nollama_url: %q\nallow_auto_model_pull: %t\nmax_concurrent_jobs: %d\nheartbeat_interval_seconds: %d\nlog_level: %q\nallowed_model_slugs:\n", cfg.ServerURL, cfg.ProviderToken, cfg.ProviderName, cfg.InstanceKey, cfg.OllamaURL, cfg.AllowAutoModelPull, cfg.MaxConcurrentJobs, cfg.HeartbeatIntervalSeconds, cfg.LogLevel))
	for _, slug := range cfg.AllowedModelSlugs {
		content.WriteString(fmt.Sprintf("  - %q\n", slug))
	}
	return os.WriteFile(path, []byte(content.String()), 0600)
}

func token(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return base64.RawURLEncoding.EncodeToString(b)
}

func ValidProviderToken(token string) bool {
	return strings.HasPrefix(token, "pvn_provider_") && len(strings.Split(token, "_")) >= 4
}
