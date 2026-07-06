package node

import (
	"context"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/nuvonode/nuvonode/apps/provider-node/internal/config"
)

func TestDoctorHappyPath(t *testing.T) {
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/health" {
			t.Fatalf("api path=%s", r.URL.Path)
		}
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	}))
	defer api.Close()
	ollama := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/tags" {
			t.Fatalf("ollama path=%s", r.URL.Path)
		}
		_, _ = w.Write([]byte(`{"models":[{"name":"qwen:7b"}]}`))
	}))
	defer ollama.Close()
	path := filepath.Join(t.TempDir(), "config.yaml")
	cfg := config.Default()
	cfg.ServerURL = api.URL
	cfg.OllamaURL = ollama.URL
	cfg.ProviderToken = "pvn_provider_abc_secret"
	if err := config.Write(path, cfg); err != nil {
		t.Fatal(err)
	}
	result := Doctor(context.Background(), path)
	if !result.OK {
		t.Fatalf("doctor failed: %#v", result.Messages)
	}
}
