package config

import (
	"path/filepath"
	"testing"
)

func TestConfigWriteLoad(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.yaml")
	cfg := Default()
	cfg.ServerURL = "http://api"
	cfg.ProviderToken = "pvn_provider_abc_secret"
	cfg.ProviderName = "Test Provider"
	cfg.AllowedModelSlugs = []string{"qwen-7b-instruct"}
	if err := Write(path, cfg); err != nil {
		t.Fatal(err)
	}
	loaded, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	if loaded.ServerURL != cfg.ServerURL || loaded.ProviderToken != cfg.ProviderToken || loaded.ProviderName != cfg.ProviderName {
		t.Fatalf("bad loaded config: %#v", loaded)
	}
	if loaded.InstanceKey == "" {
		t.Fatal("instance key not generated")
	}
	if len(loaded.AllowedModelSlugs) != 1 || loaded.AllowedModelSlugs[0] != "qwen-7b-instruct" {
		t.Fatalf("bad allowed models: %#v", loaded.AllowedModelSlugs)
	}
}

func TestValidProviderToken(t *testing.T) {
	if !ValidProviderToken("pvn_provider_abc_secret") {
		t.Fatal("valid token rejected")
	}
	if ValidProviderToken("pvn_live_abc_secret") {
		t.Fatal("api key accepted as provider token")
	}
}
