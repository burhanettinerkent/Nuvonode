package ollama

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model    string         `json:"model"`
	Messages []ChatMessage  `json:"messages"`
	Stream   bool           `json:"stream"`
	Options  map[string]any `json:"options,omitempty"`
}

type ChatResponse struct {
	Message struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"message"`
	Done            bool  `json:"done"`
	PromptEvalCount int   `json:"prompt_eval_count"`
	EvalCount       int   `json:"eval_count"`
	TotalDuration   int64 `json:"total_duration"`
}

func (c Client) Chat(ctx context.Context, req ChatRequest) (ChatResponse, time.Duration, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return ChatResponse{}, 0, err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.BaseURL+"/api/chat", bytes.NewReader(body))
	if err != nil {
		return ChatResponse{}, 0, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	start := time.Now()
	res, err := c.HTTP.Do(httpReq)
	latency := time.Since(start)
	if err != nil {
		return ChatResponse{}, latency, err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode > 299 {
		return ChatResponse{}, latency, fmt.Errorf("ollama chat status %d", res.StatusCode)
	}
	var out ChatResponse
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return ChatResponse{}, latency, err
	}
	return out, latency, nil
}
