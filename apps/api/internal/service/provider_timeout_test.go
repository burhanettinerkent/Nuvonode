package service

import (
	"testing"
	"time"

	"github.com/nuvonode/nuvonode/apps/api/internal/config"
)

func TestProviderOfflineCutoffUsesConfiguredTimeout(t *testing.T) {
	now := time.Date(2026, 7, 6, 12, 0, 0, 0, time.UTC)
	s := &ProviderService{cfg: config.Config{ProviderHeartbeatTimeout: 45 * time.Second}}
	want := now.Add(-45 * time.Second)
	if got := s.OfflineCutoff(now); !got.Equal(want) {
		t.Fatalf("cutoff=%s want=%s", got, want)
	}
}
