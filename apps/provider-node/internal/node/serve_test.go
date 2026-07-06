package node

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/nuvonode/nuvonode/apps/provider-node/internal/config"
)

func TestProviderWSURL(t *testing.T) {
	got, err := providerWSURL("http://localhost:8080")
	if err != nil {
		t.Fatal(err)
	}
	if got != "ws://localhost:8080/api/provider/ws" {
		t.Fatalf("url=%s", got)
	}
}

func TestServeOnceSendsHelloModelListHeartbeat(t *testing.T) {
	ollama := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/tags" {
			t.Fatalf("ollama path=%s", r.URL.Path)
		}
		_, _ = w.Write([]byte(`{"models":[{"name":"qwen:7b","digest":"sha256:test","size":123}]}`))
	}))
	defer ollama.Close()

	upgrader := websocket.Upgrader{}
	seen := make(chan string, 3)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/provider/ws" {
			t.Fatalf("ws path=%s", r.URL.Path)
		}
		if r.Header.Get("Authorization") != "Bearer pvn_provider_abc_secret" {
			t.Fatalf("bad auth header")
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatal(err)
		}
		defer conn.Close()
		for {
			var msg struct {
				Type string `json:"type"`
			}
			if err := conn.ReadJSON(&msg); err != nil {
				return
			}
			seen <- msg.Type
			if msg.Type == "provider.hello" {
				_ = conn.WriteJSON(map[string]any{"type": "server.hello_ack", "payload": map[string]any{"provider_id": "prv_test", "instance_id": "pin_test", "approval_status": "approved"}})
			}
			if msg.Type == "provider.heartbeat" {
				return
			}
		}
	}))
	defer server.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	errc := make(chan error, 1)
	go func() {
		errc <- serveOnce(ctx, config.Config{ServerURL: server.URL, ProviderToken: "pvn_provider_abc_secret", InstanceKey: "fake", OllamaURL: ollama.URL, HeartbeatIntervalSeconds: 1})
	}()

	want := []string{"provider.hello", "provider.model_list", "provider.heartbeat"}
	for _, expected := range want {
		select {
		case got := <-seen:
			if got != expected {
				b, _ := json.Marshal(want)
				t.Fatalf("got %s want %s in sequence %s", got, expected, b)
			}
		case <-time.After(3 * time.Second):
			t.Fatalf("timed out waiting for %s", expected)
		}
	}
	select {
	case <-errc:
	case <-time.After(3 * time.Second):
		t.Fatal("serveOnce did not return after server close")
	}
}
