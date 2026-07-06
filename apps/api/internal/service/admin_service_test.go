package service

import (
	"context"
	"errors"
	"testing"

	"github.com/nuvonode/nuvonode/apps/api/internal/domain"
)

func TestAdminServiceRejectsNonAdmin(t *testing.T) {
	svc := &AdminService{}
	user := domain.User{Role: "user"}

	if _, err := svc.Jobs(context.Background(), user); !errors.Is(err, ErrForbidden) {
		t.Fatalf("Jobs error=%v want %v", err, ErrForbidden)
	}
	if _, err := svc.Usage(context.Background(), user); !errors.Is(err, ErrForbidden) {
		t.Fatalf("Usage error=%v want %v", err, ErrForbidden)
	}
	if _, err := svc.AdjustWallet(context.Background(), user, "usr_1", 1, "test"); !errors.Is(err, ErrForbidden) {
		t.Fatalf("AdjustWallet error=%v want %v", err, ErrForbidden)
	}
	if _, err := svc.Models(context.Background(), user); !errors.Is(err, ErrForbidden) {
		t.Fatalf("Models error=%v want %v", err, ErrForbidden)
	}
	if _, err := svc.CreateModel(context.Background(), user, domain.ModelInput{}); !errors.Is(err, ErrForbidden) {
		t.Fatalf("CreateModel error=%v want %v", err, ErrForbidden)
	}
	if _, err := svc.UpdateModel(context.Background(), user, "mdl_1", domain.ModelPatch{}); !errors.Is(err, ErrForbidden) {
		t.Fatalf("UpdateModel error=%v want %v", err, ErrForbidden)
	}
	if err := svc.PauseModel(context.Background(), user, "mdl_1"); !errors.Is(err, ErrForbidden) {
		t.Fatalf("PauseModel error=%v want %v", err, ErrForbidden)
	}
	if _, err := svc.Providers(context.Background(), user); !errors.Is(err, ErrForbidden) {
		t.Fatalf("Providers error=%v want %v", err, ErrForbidden)
	}
	if err := svc.SetProviderApproval(context.Background(), user, "pvd_1", "approved"); !errors.Is(err, ErrForbidden) {
		t.Fatalf("SetProviderApproval error=%v want %v", err, ErrForbidden)
	}
	if err := svc.DisableProvider(context.Background(), user, "pvd_1"); !errors.Is(err, ErrForbidden) {
		t.Fatalf("DisableProvider error=%v want %v", err, ErrForbidden)
	}
	if _, err := svc.PendingProviderModelAdvertisements(context.Background(), user); !errors.Is(err, ErrForbidden) {
		t.Fatalf("PendingProviderModelAdvertisements error=%v want %v", err, ErrForbidden)
	}
	if err := svc.SetProviderModelAdvertisementStatus(context.Background(), user, "pma_1", "approved"); !errors.Is(err, ErrForbidden) {
		t.Fatalf("SetProviderModelAdvertisementStatus error=%v want %v", err, ErrForbidden)
	}
}

func TestAdminServiceValidatesStatuses(t *testing.T) {
	svc := &AdminService{}
	admin := domain.User{Role: "admin"}

	if _, err := svc.CreateModel(context.Background(), admin, domain.ModelInput{Slug: "x", DisplayName: "X", Family: "x", Status: "disabled"}); !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("CreateModel error=%v want %v", err, ErrInvalidInput)
	}
	badModality := "video"
	if _, err := svc.UpdateModel(context.Background(), admin, "mdl_1", domain.ModelPatch{Modality: &badModality}); !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("UpdateModel error=%v want %v", err, ErrInvalidInput)
	}
	if err := svc.SetProviderApproval(context.Background(), admin, "pvd_1", "disabled"); !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("SetProviderApproval error=%v want %v", err, ErrInvalidInput)
	}
	if err := svc.SetProviderModelAdvertisementStatus(context.Background(), admin, "pma_1", "disabled"); !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("SetProviderModelAdvertisementStatus error=%v want %v", err, ErrInvalidInput)
	}
}
