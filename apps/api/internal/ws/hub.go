package ws

import (
	"errors"
	"sync"
	"time"

	"github.com/gofiber/contrib/websocket"
)

var ErrProviderUnavailable = errors.New("provider unavailable")
var ErrJobTimeout = errors.New("job timeout")

type Hub struct {
	mu        sync.RWMutex
	providers map[string]*ProviderConnection
	jobs      map[string]chan JobResultPayload
}

type ProviderConnection struct {
	ProviderPublicID string
	conn             *websocket.Conn
	writeMu          sync.Mutex
}

type JobRequestPayload struct {
	JobID            string         `json:"job_id"`
	ModelSlug        string         `json:"model_slug"`
	Runtime          string         `json:"runtime"`
	RuntimeModelName string         `json:"runtime_model_name"`
	Messages         []ChatMessage  `json:"messages"`
	Parameters       map[string]any `json:"parameters"`
	TimeoutSeconds   int            `json:"timeout_seconds"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type JobResultPayload struct {
	JobID        string    `json:"job_id"`
	Content      string    `json:"content"`
	FinishReason string    `json:"finish_reason"`
	Usage        *JobUsage `json:"usage,omitempty"`
	LatencyMS    int       `json:"latency_ms"`
	ErrorCode    string    `json:"-"`
	ErrorMessage string    `json:"-"`
}

type JobUsage struct {
	PromptTokens     int    `json:"prompt_tokens"`
	CompletionTokens int    `json:"completion_tokens"`
	TotalTokens      int    `json:"total_tokens"`
	Source           string `json:"source"`
}

type JobErrorPayload struct {
	JobID        string `json:"job_id"`
	ErrorCode    string `json:"error_code"`
	ErrorMessage string `json:"error_message"`
}

func NewHub() *Hub {
	return &Hub{providers: map[string]*ProviderConnection{}, jobs: map[string]chan JobResultPayload{}}
}

func (h *Hub) Register(providerPublicID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.providers[providerPublicID] = &ProviderConnection{ProviderPublicID: providerPublicID, conn: conn}
}

func (h *Hub) Unregister(providerPublicID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.providers, providerPublicID)
}

func (h *Hub) Disconnect(providerPublicID string) error {
	h.mu.Lock()
	provider := h.providers[providerPublicID]
	delete(h.providers, providerPublicID)
	h.mu.Unlock()
	if provider == nil {
		return nil
	}
	return provider.conn.Close()
}

func (h *Hub) Dispatch(providerPublicID string, payload JobRequestPayload, timeout time.Duration) (JobResultPayload, error) {
	h.mu.RLock()
	provider := h.providers[providerPublicID]
	h.mu.RUnlock()
	if provider == nil {
		return JobResultPayload{}, ErrProviderUnavailable
	}
	resultc := make(chan JobResultPayload, 1)
	h.mu.Lock()
	h.jobs[payload.JobID] = resultc
	h.mu.Unlock()
	defer func() {
		h.mu.Lock()
		delete(h.jobs, payload.JobID)
		h.mu.Unlock()
	}()
	provider.writeMu.Lock()
	err := provider.conn.WriteJSON(struct {
		Type      string            `json:"type"`
		MessageID string            `json:"message_id"`
		SentAt    time.Time         `json:"sent_at"`
		Payload   JobRequestPayload `json:"payload"`
	}{Type: "server.job_request", MessageID: "msg_" + payload.JobID, SentAt: time.Now().UTC(), Payload: payload})
	provider.writeMu.Unlock()
	if err != nil {
		return JobResultPayload{}, err
	}
	if timeout <= 0 {
		timeout = 120 * time.Second
	}
	select {
	case result := <-resultc:
		return result, nil
	case <-time.After(timeout):
		return JobResultPayload{}, ErrJobTimeout
	}
}

func (h *Hub) Complete(result JobResultPayload) bool {
	h.mu.RLock()
	resultc := h.jobs[result.JobID]
	h.mu.RUnlock()
	if resultc == nil {
		return false
	}
	resultc <- result
	return true
}
