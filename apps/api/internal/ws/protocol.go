package ws

import (
	"encoding/json"
	"time"
)

type Envelope struct {
	Type      string          `json:"type"`
	MessageID string          `json:"message_id,omitempty"`
	SentAt    time.Time       `json:"sent_at,omitempty"`
	Payload   json.RawMessage `json:"payload"`
}

type HelloPayload struct {
	InstanceKey string `json:"instance_key"`
	AppVersion  string `json:"app_version"`
	Hostname    string `json:"hostname"`
	OS          string `json:"os"`
	Arch        string `json:"arch"`
	OllamaURL   string `json:"ollama_url"`
}

type HeartbeatPayload struct {
	Status                string  `json:"status"`
	CurrentJobID          *string `json:"current_job_id"`
	QueueDepth            int     `json:"queue_depth"`
	GPUUtilizationPercent *int    `json:"gpu_utilization_percent"`
	GPUTemperatureC       *int    `json:"gpu_temperature_c"`
	AvailableVRAMMB       *int    `json:"available_vram_mb"`
}

type ModelListPayload struct {
	Runtime string              `json:"runtime"`
	Models  []RuntimeModelEntry `json:"models"`
}

type RuntimeModelEntry struct {
	RuntimeModelName string `json:"runtime_model_name"`
	Digest           string `json:"digest"`
	SizeBytes        int64  `json:"size_bytes"`
}

type HardwareReportPayload struct {
	CPUModel string          `json:"cpu_model"`
	RAMMB    int             `json:"ram_mb"`
	GPUs     []GPUReport     `json:"gpus"`
	Raw      json.RawMessage `json:"raw"`
}

type GPUReport struct {
	Name   string `json:"name"`
	VRAMMB int    `json:"vram_mb"`
	Driver string `json:"driver"`
}
