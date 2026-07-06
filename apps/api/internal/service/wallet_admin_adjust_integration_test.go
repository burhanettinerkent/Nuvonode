package service

import (
	"context"
	"os"
	"testing"

	"github.com/nuvonode/nuvonode/apps/api/internal/config"
	"github.com/nuvonode/nuvonode/apps/api/internal/database"
	"github.com/nuvonode/nuvonode/apps/api/internal/domain"
	"github.com/nuvonode/nuvonode/apps/api/internal/repository"
)

func TestAdminAdjustWalletIntegration(t *testing.T) {
	if os.Getenv("NUVONODE_RUN_DB_TESTS") != "1" {
		t.Skip("set NUVONODE_RUN_DB_TESTS=1 with DATABASE_URL to run")
	}
	ctx := context.Background()
	db, err := database.NewPostgres(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	svc := New(config.Load(), repository.NewStore(db))
	admin, err := svc.Auth.Login(ctx, "admin-curl@nuvonode.local", "adminpass123")
	if err != nil {
		t.Fatal(err)
	}
	user, err := svc.Auth.Login(ctx, "user-curl@nuvonode.local", "userpass123")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Admin.AdjustWallet(ctx, domain.User{ID: admin.User.ID, Role: "admin"}, user.User.PublicID, 1, "integration test"); err != nil {
		t.Fatal(err)
	}
}
