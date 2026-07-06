package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/nuvonode/nuvonode/apps/api/internal/domain"
)

func TestUsageServiceRejectsInvertedDateRange(t *testing.T) {
	svc := &UsageService{}
	from := time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC)
	to := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	_, err := svc.List(context.Background(), domain.User{ID: "user-id"}, domain.UsageFilter{From: &from, To: &to})
	if !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("List error=%v want %v", err, ErrInvalidInput)
	}
}
