package integration_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/fasthttp/websocket"
	fiberws "github.com/gofiber/contrib/websocket"
	"github.com/nuvonode/nuvonode/apps/api/internal/config"
	"github.com/nuvonode/nuvonode/apps/api/internal/database"
	"github.com/nuvonode/nuvonode/apps/api/internal/handler"
	"github.com/nuvonode/nuvonode/apps/api/internal/observability"
	"github.com/nuvonode/nuvonode/apps/api/internal/repository"
	"github.com/nuvonode/nuvonode/apps/api/internal/router"
	"github.com/nuvonode/nuvonode/apps/api/internal/service"
	wsp "github.com/nuvonode/nuvonode/apps/api/internal/ws"
)

func TestProviderWebSocketHelloHeartbeat(t *testing.T) {
	if os.Getenv("NUVONODE_INTEGRATION") != "1" {
		t.Skip("set NUVONODE_INTEGRATION=1 with migrated TEST_DATABASE_URL and TEST_REDIS_URL")
	}

	ctx := context.Background()
	cfg := config.Load()
	cfg.DatabaseURL = env("TEST_DATABASE_URL", cfg.DatabaseURL)
	cfg.RedisURL = env("TEST_REDIS_URL", cfg.RedisURL)
	cfg.HTTPAddr = "127.0.0.1:0"
	cfg.AppEnv = "development"
	cfg.AllowDevAutoApproveProvider = true
	cfg.BootstrapFirstUserAdmin = false

	db, err := database.NewPostgres(ctx, cfg.DatabaseURL)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(db.Close)
	rdb, err := database.NewRedis(ctx, cfg.RedisURL)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = rdb.Close() })
	log, err := observability.NewLogger("development")
	if err != nil {
		t.Fatal(err)
	}
	store := repository.NewStore(db)
	svc := service.New(cfg, store)
	hub := wsp.NewHub()
	h := handler.New(cfg, db, rdb, svc, hub)
	app := router.New(cfg, log, rdb, h, svc)

	ln, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go func() { _ = app.Listener(ln) }()
	t.Cleanup(func() { _ = app.Shutdown() })

	suffix := time.Now().UnixNano()
	registered, err := svc.Auth.Register(ctx, service.RegisterInput{Email: fmt.Sprintf("provider-test-%d@example.com", suffix), Password: "password123", DisplayName: "Provider Test"})
	if err != nil {
		t.Fatal(err)
	}
	provider, err := svc.Provider.Create(ctx, registered.User, service.ProviderInput{Name: "Fake Provider"})
	if err != nil {
		t.Fatal(err)
	}

	conn, _, err := websocket.DefaultDialer.Dial("ws://"+ln.Addr().String()+"/api/provider/ws", http.Header{"Authorization": {"Bearer " + provider.PlaintextToken}})
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()

	helloPayload, _ := json.Marshal(wsp.HelloPayload{InstanceKey: fmt.Sprintf("fake-%d", suffix), AppVersion: "test", Hostname: "fakehost", OS: "linux", Arch: "amd64"})
	if err := conn.WriteJSON(wsp.Envelope{Type: "provider.hello", MessageID: "msg_1", SentAt: time.Now().UTC(), Payload: helloPayload}); err != nil {
		t.Fatal(err)
	}
	var ack struct {
		Type    string `json:"type"`
		Payload struct {
			ProviderID     string `json:"provider_id"`
			InstanceID     string `json:"instance_id"`
			ApprovalStatus string `json:"approval_status"`
		} `json:"payload"`
	}
	if err := conn.ReadJSON(&ack); err != nil {
		t.Fatal(err)
	}
	if ack.Type != "server.hello_ack" || ack.Payload.ProviderID != provider.Provider.PublicID || ack.Payload.InstanceID == "" {
		t.Fatalf("bad ack: %#v", ack)
	}

	heartbeatPayload, _ := json.Marshal(wsp.HeartbeatPayload{Status: "online", QueueDepth: 0})
	if err := conn.WriteJSON(wsp.Envelope{Type: "provider.heartbeat", MessageID: "msg_2", SentAt: time.Now().UTC(), Payload: heartbeatPayload}); err != nil {
		t.Fatal(err)
	}

	var status string
	if err := db.QueryRow(ctx, `SELECT status FROM provider_instances WHERE public_id=$1`, ack.Payload.InstanceID).Scan(&status); err != nil {
		t.Fatal(err)
	}
	if status != "online" {
		t.Fatalf("status=%s", status)
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

var _ = fiberws.Config{}
