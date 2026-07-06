package node

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/nuvonode/nuvonode/apps/provider-node/internal/config"
	"github.com/nuvonode/nuvonode/apps/provider-node/internal/ollama"
)

type DoctorResult struct {
	OK       bool
	Messages []string
}

func Doctor(ctx context.Context, path string) DoctorResult {
	result := DoctorResult{OK: true}
	cfg, err := config.Load(path)
	if err != nil {
		return DoctorResult{Messages: []string{"[fail] config loaded: " + err.Error()}}
	}
	result.Messages = append(result.Messages, "[ok] config loaded")
	if config.ValidProviderToken(cfg.ProviderToken) {
		result.Messages = append(result.Messages, "[ok] provider token format valid")
	} else {
		result.OK = false
		result.Messages = append(result.Messages, "[fail] provider token format invalid")
	}
	if err := checkServer(ctx, cfg.ServerURL); err != nil {
		result.OK = false
		result.Messages = append(result.Messages, "[fail] server reachable: "+err.Error())
	} else {
		result.Messages = append(result.Messages, "[ok] server reachable: "+cfg.ServerURL)
	}
	models, err := ollama.New(cfg.OllamaURL).Tags(ctx)
	if err != nil {
		result.OK = false
		result.Messages = append(result.Messages, "[fail] ollama reachable: "+err.Error())
	} else {
		result.Messages = append(result.Messages, fmt.Sprintf("[ok] ollama reachable: %s", cfg.OllamaURL))
		result.Messages = append(result.Messages, fmt.Sprintf("[ok] models found: %d", len(models)))
	}
	return result
}

func checkServer(ctx context.Context, baseURL string) error {
	client := http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, strings.TrimRight(baseURL, "/")+"/health", nil)
	if err != nil {
		return err
	}
	res, err := client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode > 299 {
		return fmt.Errorf("status %d", res.StatusCode)
	}
	return nil
}
