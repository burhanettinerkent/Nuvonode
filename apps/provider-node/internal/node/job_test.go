package node

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/nuvonode/nuvonode/apps/provider-node/internal/config"
	"github.com/nuvonode/nuvonode/apps/provider-node/internal/protocol"
)

func TestExecuteJobReturnsOllamaResult(t *testing.T) {
	ollama := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/chat" {
			t.Fatalf("path=%s", r.URL.Path)
		}
		_, _ = w.Write([]byte(`{"message":{"role":"assistant","content":"pong"},"done":true,"prompt_eval_count":2,"eval_count":3}`))
	}))
	defer ollama.Close()
	payload, _ := json.Marshal(protocol.JobRequestPayload{JobID: "job_test", Runtime: "ollama", RuntimeModelName: "qwen:7b", Messages: []protocol.ChatMessage{{Role: "user", Content: "ping"}}, Parameters: protocol.JobParameters{MaxTokens: 8}, TimeoutSeconds: 5})
	out := make(chan protocol.Envelope, 1)
	executeJob(context.Background(), config.Config{OllamaURL: ollama.URL}, payload, func(v any) error {
		b, _ := json.Marshal(v)
		var env protocol.Envelope
		if err := json.Unmarshal(b, &env); err != nil {
			return err
		}
		out <- env
		return nil
	})
	env := <-out
	if env.Type != "provider.job_result" {
		t.Fatalf("type=%s", env.Type)
	}
	b, _ := json.Marshal(env.Payload)
	var result protocol.JobResultPayload
	if err := json.Unmarshal(b, &result); err != nil {
		t.Fatal(err)
	}
	if result.JobID != "job_test" || result.Content != "pong" || result.Usage.TotalTokens != 5 {
		t.Fatalf("bad result: %#v", result)
	}
}
