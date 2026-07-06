package node

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/nuvonode/nuvonode/apps/provider-node/internal/config"
	"github.com/nuvonode/nuvonode/apps/provider-node/internal/ollama"
	"github.com/nuvonode/nuvonode/apps/provider-node/internal/protocol"
)

const appVersion = "dev"

type ServeOptions struct {
	ConfigPath string
	Once       bool
}

func Serve(ctx context.Context, opts ServeOptions) error {
	cfg, err := config.Load(opts.ConfigPath)
	if err != nil {
		return err
	}
	if !config.ValidProviderToken(cfg.ProviderToken) {
		return fmt.Errorf("provider token format invalid")
	}
	backoff := time.Second
	for {
		err := serveOnce(ctx, cfg)
		if opts.Once || ctx.Err() != nil {
			return err
		}
		fmt.Printf("[warn] websocket disconnected: %v; reconnecting in %s\n", err, backoff)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(backoff + time.Duration(rand.Int63n(int64(time.Second)))):
		}
		backoff *= 2
		if backoff > 30*time.Second {
			backoff = 30 * time.Second
		}
	}
}

func serveOnce(ctx context.Context, cfg config.Config) error {
	conn, err := dial(ctx, cfg)
	if err != nil {
		return err
	}
	defer conn.Close()
	var writeMu sync.Mutex
	writeJSON := func(v any) error {
		writeMu.Lock()
		defer writeMu.Unlock()
		return conn.WriteJSON(v)
	}
	if err := sendHello(writeJSON, cfg); err != nil {
		return err
	}
	if err := sendModelList(ctx, writeJSON, cfg); err != nil {
		fmt.Printf("[warn] model list failed: %v\n", err)
	}
	interval := time.Duration(cfg.HeartbeatIntervalSeconds) * time.Second
	if interval <= 0 {
		interval = 15 * time.Second
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	errc := make(chan error, 1)
	go readLoop(ctx, conn, cfg, writeJSON, errc)
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case err := <-errc:
			return err
		case <-ticker.C:
			if err := writeJSON(protocol.NewEnvelope("provider.heartbeat", protocol.HeartbeatPayload{Status: "online", QueueDepth: 0})); err != nil {
				return err
			}
		}
	}
}

func dial(ctx context.Context, cfg config.Config) (*websocket.Conn, error) {
	wsURL, err := providerWSURL(cfg.ServerURL)
	if err != nil {
		return nil, err
	}
	dialer := websocket.Dialer{HandshakeTimeout: 10 * time.Second}
	conn, _, err := dialer.DialContext(ctx, wsURL, http.Header{"Authorization": {"Bearer " + cfg.ProviderToken}})
	return conn, err
}

func providerWSURL(serverURL string) (string, error) {
	u, err := url.Parse(serverURL)
	if err != nil {
		return "", err
	}
	switch u.Scheme {
	case "http":
		u.Scheme = "ws"
	case "https":
		u.Scheme = "wss"
	case "ws", "wss":
	default:
		return "", fmt.Errorf("unsupported server URL scheme %q", u.Scheme)
	}
	u.Path = strings.TrimRight(u.Path, "/") + "/api/provider/ws"
	u.RawQuery = ""
	return u.String(), nil
}

func sendHello(writeJSON func(any) error, cfg config.Config) error {
	hostname, _ := os.Hostname()
	return writeJSON(protocol.NewEnvelope("provider.hello", protocol.HelloPayload{InstanceKey: cfg.InstanceKey, AppVersion: appVersion, Hostname: hostname, OS: runtime.GOOS, Arch: runtime.GOARCH, OllamaURL: cfg.OllamaURL}))
}

func sendModelList(ctx context.Context, writeJSON func(any) error, cfg config.Config) error {
	models, err := ollama.New(cfg.OllamaURL).Tags(ctx)
	if err != nil {
		return err
	}
	entries := make([]protocol.RuntimeModelEntry, 0, len(models))
	for _, model := range models {
		entries = append(entries, protocol.RuntimeModelEntry{RuntimeModelName: model.Name, Digest: model.Digest, SizeBytes: model.SizeBytes})
	}
	return writeJSON(protocol.NewEnvelope("provider.model_list", protocol.ModelListPayload{Runtime: "ollama", Models: entries}))
}

func readLoop(ctx context.Context, conn *websocket.Conn, cfg config.Config, writeJSON func(any) error, errc chan<- error) {
	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			errc <- err
			return
		}
		env, err := protocol.DecodeEnvelope(data)
		if err != nil {
			fmt.Printf("[warn] invalid server message: %v\n", err)
			continue
		}
		switch env.Type {
		case "server.hello_ack":
			fmt.Println("[ok] provider websocket accepted")
		case "server.job_request":
			payload, ok := env.Payload.(json.RawMessage)
			if !ok {
				fmt.Println("[warn] job request missing payload")
				continue
			}
			go executeJob(ctx, cfg, payload, writeJSON)
		case "server.drain":
			fmt.Println("[warn] server requested drain")
		default:
			fmt.Printf("[info] server message: %s\n", env.Type)
		}
	}
}

func executeJob(ctx context.Context, cfg config.Config, payload json.RawMessage, writeJSON func(any) error) {
	var job protocol.JobRequestPayload
	if err := json.Unmarshal(payload, &job); err != nil {
		fmt.Printf("[warn] invalid job request: %v\n", err)
		return
	}
	if job.Runtime != "ollama" {
		_ = writeJSON(protocol.NewEnvelope("provider.job_error", protocol.JobErrorPayload{JobID: job.JobID, ErrorCode: "unsupported_runtime", ErrorMessage: "Only Ollama runtime is supported in V1 provider node."}))
		return
	}
	messages := make([]ollama.ChatMessage, 0, len(job.Messages))
	for _, msg := range job.Messages {
		messages = append(messages, ollama.ChatMessage{Role: msg.Role, Content: msg.Content})
	}
	options := map[string]any{}
	if job.Parameters.Temperature != nil {
		options["temperature"] = *job.Parameters.Temperature
	}
	if job.Parameters.MaxTokens > 0 {
		options["num_predict"] = job.Parameters.MaxTokens
	}
	jobCtx := ctx
	if job.TimeoutSeconds > 0 {
		var cancel context.CancelFunc
		jobCtx, cancel = context.WithTimeout(ctx, time.Duration(job.TimeoutSeconds)*time.Second)
		defer cancel()
	}
	response, latency, err := ollama.New(cfg.OllamaURL).Chat(jobCtx, ollama.ChatRequest{Model: job.RuntimeModelName, Messages: messages, Stream: false, Options: options})
	if err != nil {
		_ = writeJSON(protocol.NewEnvelope("provider.job_error", protocol.JobErrorPayload{JobID: job.JobID, ErrorCode: "ollama_failed", ErrorMessage: err.Error()}))
		return
	}
	usage := &protocol.JobUsage{PromptTokens: response.PromptEvalCount, CompletionTokens: response.EvalCount, TotalTokens: response.PromptEvalCount + response.EvalCount, Source: "runtime_reported"}
	_ = writeJSON(protocol.NewEnvelope("provider.job_result", protocol.JobResultPayload{JobID: job.JobID, Content: response.Message.Content, FinishReason: "stop", Usage: usage, LatencyMS: int(latency.Milliseconds())}))
}
