package protocol

import (
	"encoding/json"
	"time"
)

type Envelope struct {
	Type      string    `json:"type"`
	MessageID string    `json:"message_id,omitempty"`
	SentAt    time.Time `json:"sent_at,omitempty"`
	Payload   any       `json:"payload"`
}

type HelloPayload struct {
	InstanceKey string `json:"instance_key"`
	AppVersion  string `json:"app_version"`
	Hostname    string `json:"hostname"`
	OS          string `json:"os"`
	Arch        string `json:"arch"`
	OllamaURL   string `json:"ollama_url"`
}

type ModelListPayload struct {
	Runtime string              `json:"runtime"`
	Models  []RuntimeModelEntry `json:"models"`
}

type RuntimeModelEntry struct {
	RuntimeModelName string `json:"runtime_model_name"`
	Digest           string `json:"digest,omitempty"`
	SizeBytes        int64  `json:"size_bytes,omitempty"`
}

type HeartbeatPayload struct {
	Status                string  `json:"status"`
	CurrentJobID          *string `json:"current_job_id"`
	QueueDepth            int     `json:"queue_depth"`
	GPUUtilizationPercent *int    `json:"gpu_utilization_percent,omitempty"`
	GPUTemperatureC       *int    `json:"gpu_temperature_c,omitempty"`
	AvailableVRAMMB       *int    `json:"available_vram_mb,omitempty"`
}

type JobRequestPayload struct {
	JobID            string        `json:"job_id"`
	ModelSlug        string        `json:"model_slug"`
	Runtime          string        `json:"runtime"`
	RuntimeModelName string        `json:"runtime_model_name"`
	Messages         []ChatMessage `json:"messages"`
	Parameters       JobParameters `json:"parameters"`
	TimeoutSeconds   int           `json:"timeout_seconds"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type JobParameters struct {
	Temperature *float64 `json:"temperature"`
	MaxTokens   int      `json:"max_tokens"`
	TopP        *float64 `json:"top_p"`
}

type JobResultPayload struct {
	JobID        string    `json:"job_id"`
	Content      string    `json:"content"`
	FinishReason string    `json:"finish_reason"`
	Usage        *JobUsage `json:"usage,omitempty"`
	LatencyMS    int       `json:"latency_ms"`
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

func NewEnvelope(messageType string, payload any) Envelope {
	return Envelope{Type: messageType, MessageID: "msg_" + time.Now().UTC().Format("20060102150405.000000000"), SentAt: time.Now().UTC(), Payload: payload}
}

func DecodeEnvelope(data []byte) (Envelope, error) {
	var raw struct {
		Type      string          `json:"type"`
		MessageID string          `json:"message_id"`
		SentAt    time.Time       `json:"sent_at"`
		Payload   json.RawMessage `json:"payload"`
	}
	if err := json.Unmarshal(data, &raw); err != nil {
		return Envelope{}, err
	}
	return Envelope{Type: raw.Type, MessageID: raw.MessageID, SentAt: raw.SentAt, Payload: raw.Payload}, nil
}
