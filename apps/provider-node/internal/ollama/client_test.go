package ollama

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestTags(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/tags" {
			t.Fatalf("path=%s", r.URL.Path)
		}
		_, _ = w.Write([]byte(`{"models":[{"name":"qwen:7b"}]}`))
	}))
	defer server.Close()
	models, err := New(server.URL).Tags(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(models) != 1 || models[0].Name != "qwen:7b" {
		t.Fatalf("models=%#v", models)
	}
}
