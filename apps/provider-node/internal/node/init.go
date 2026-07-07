package node

import (
	"flag"
	"fmt"

	"github.com/nuvonode/nuvonode/apps/provider-node/internal/config"
)

func Init(args []string) error {
	fs := flag.NewFlagSet("init", flag.ContinueOnError)
	server := fs.String("server", "http://localhost:18080", "Nuvonode API server URL")
	token := fs.String("token", "", "Provider token")
	name := fs.String("name", "Local Provider", "Provider display name")
	ollamaURL := fs.String("ollama-url", "http://localhost:11434", "Ollama URL")
	path := fs.String("config", "", "Config path")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if !config.ValidProviderToken(*token) {
		return fmt.Errorf("provider token must start with pvn_provider_")
	}
	configPath := *path
	if configPath == "" {
		p, err := config.DefaultPath()
		if err != nil {
			return err
		}
		configPath = p
	}
	cfg := config.Default()
	cfg.ServerURL = *server
	cfg.ProviderToken = *token
	cfg.ProviderName = *name
	cfg.OllamaURL = *ollamaURL
	return config.Write(configPath, cfg)
}
