package service

import (
	"context"
	"errors"
	"math"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/nuvonode/nuvonode/apps/api/internal/auth"
	"github.com/nuvonode/nuvonode/apps/api/internal/config"
	"github.com/nuvonode/nuvonode/apps/api/internal/database"
	"github.com/nuvonode/nuvonode/apps/api/internal/domain"
	"github.com/nuvonode/nuvonode/apps/api/internal/repository"
)

var ErrInvalidCredentials = errors.New("invalid credentials")
var ErrInsufficientCredits = errors.New("insufficient credits")
var ErrForbidden = errors.New("forbidden")

type Services struct {
	Auth     *AuthService
	Projects *ProjectService
	Wallets  *WalletService
	Models   *ModelService
	Provider *ProviderService
	Usage    *UsageService
	OpenAI   *OpenAIService
	Admin    *AdminService
}

func New(cfg config.Config, store *repository.Store) *Services {
	wallets := &WalletService{cfg: cfg, store: store}
	return &Services{
		Auth:     &AuthService{cfg: cfg, store: store, wallets: wallets},
		Projects: &ProjectService{store: store},
		Wallets:  wallets,
		Models:   &ModelService{store: store},
		Provider: &ProviderService{cfg: cfg, store: store, wallets: wallets},
		Usage:    &UsageService{store: store},
		OpenAI:   &OpenAIService{cfg: cfg, store: store},
		Admin:    &AdminService{store: store, wallets: wallets},
	}
}

type AuthService struct {
	cfg     config.Config
	store   *repository.Store
	wallets *WalletService
}

type RegisterInput struct{ Email, Password, DisplayName string }

type AuthResult struct {
	User        domain.User
	AccessToken string
}

func (s *AuthService) Register(ctx context.Context, in RegisterInput) (AuthResult, error) {
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if in.Email == "" || len(in.Password) < 8 || strings.TrimSpace(in.DisplayName) == "" {
		return AuthResult{}, ErrInvalidInput
	}
	passwordHash, err := auth.HashPassword(in.Password)
	if err != nil {
		return AuthResult{}, err
	}
	var out AuthResult
	err = database.InTx(ctx, s.store.DB, func(tx pgx.Tx) error {
		count, err := s.store.CountUsers(ctx, tx)
		if err != nil {
			return err
		}
		role := "user"
		if count == 0 && s.cfg.BootstrapFirstUserAdmin {
			role = "admin"
		}
		u, err := s.store.CreateUser(ctx, tx, auth.PublicID("usr"), in.Email, passwordHash, strings.TrimSpace(in.DisplayName), role)
		if err != nil {
			return err
		}
		w, err := s.store.CreateWallet(ctx, tx, auth.PublicID("wal"), "user", u.ID)
		if err != nil {
			return err
		}
		if err := s.wallets.addLedger(ctx, tx, w.ID, "grant", s.cfg.StartingFreeCredits, 0, "starting_free_credits", nil); err != nil {
			return err
		}
		out.User = u
		return nil
	})
	if err != nil {
		return out, err
	}
	out.AccessToken, err = auth.SignJWT(s.cfg.JWTSecret, out.User.PublicID, out.User.Email, out.User.Role)
	return out, err
}

func (s *AuthService) Login(ctx context.Context, email, password string) (AuthResult, error) {
	u, err := s.store.UserByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil || !auth.CheckPassword(u.PasswordHash, password) || u.Status != "active" {
		return AuthResult{}, ErrInvalidCredentials
	}
	t, err := auth.SignJWT(s.cfg.JWTSecret, u.PublicID, u.Email, u.Role)
	return AuthResult{User: u, AccessToken: t}, err
}

func (s *AuthService) UserFromJWT(ctx context.Context, token string) (domain.User, error) {
	claims, err := auth.ParseJWT(s.cfg.JWTSecret, token)
	if err != nil {
		return domain.User{}, ErrInvalidCredentials
	}
	return s.store.UserByPublicID(ctx, claims.UserID)
}

type WalletService struct {
	cfg   config.Config
	store *repository.Store
}

func (s *WalletService) UserWallet(ctx context.Context, userPublicID string) (domain.Wallet, error) {
	return s.store.WalletByOwner(ctx, "user", userPublicID)
}
func (s *WalletService) Ledger(ctx context.Context, walletID string) ([]domain.LedgerEntry, error) {
	return s.store.LedgerForWallet(ctx, walletID)
}

func (s *WalletService) AdminAdjust(ctx context.Context, actorUserID, targetUserPublicID string, amount int64, reason string) (domain.Wallet, error) {
	reason = strings.TrimSpace(reason)
	if amount == 0 || reason == "" {
		return domain.Wallet{}, ErrInvalidInput
	}
	var out domain.Wallet
	ledgerReason := "admin_adjustment: " + reason
	err := database.InTx(ctx, s.store.DB, func(tx pgx.Tx) error {
		if err := tx.QueryRow(ctx, `SELECT w.id::text, w.public_id, w.owner_type, w.owner_id::text, w.balance_credits, w.reserved_credits FROM wallets w JOIN users u ON u.id=w.owner_id WHERE w.owner_type='user' AND u.public_id=$1 FOR UPDATE OF w`, targetUserPublicID).Scan(&out.ID, &out.PublicID, &out.OwnerType, &out.OwnerID, &out.BalanceCredits, &out.ReservedCredits); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return repository.ErrNotFound
			}
			return err
		}
		if err := s.addLedger(ctx, tx, out.ID, "admin_adjustment", amount, 0, ledgerReason, &actorUserID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `INSERT INTO audit_log (public_id, actor_user_id, action, target_type, target_id, metadata) VALUES ($1,$2::uuid,'wallet_admin_adjustment','wallet',$3::uuid,jsonb_build_object('target_user_id',$4::text,'amount_credits',$5::bigint,'reason',$6::text))`, auth.PublicID("aud"), actorUserID, out.ID, targetUserPublicID, amount, reason); err != nil {
			return err
		}
		return tx.QueryRow(ctx, `SELECT id::text, public_id, owner_type, owner_id::text, balance_credits, reserved_credits FROM wallets WHERE id=$1`, out.ID).Scan(&out.ID, &out.PublicID, &out.OwnerType, &out.OwnerID, &out.BalanceCredits, &out.ReservedCredits)
	})
	return out, err
}

func (s *WalletService) ReserveForUser(ctx context.Context, userID string, amount int64, reason string) (string, error) {
	if amount <= 0 {
		return "", ErrInvalidInput
	}
	var walletID string
	err := database.InTx(ctx, s.store.DB, func(tx pgx.Tx) error {
		if err := tx.QueryRow(ctx, `SELECT id::text FROM wallets WHERE owner_type='user' AND owner_id=$1`, userID).Scan(&walletID); err != nil {
			return err
		}
		return s.addLedger(ctx, tx, walletID, "reserve", -amount, amount, reason, nil)
	})
	return walletID, err
}

func (s *WalletService) Release(ctx context.Context, walletID string, amount int64, reason string) error {
	if amount <= 0 {
		return ErrInvalidInput
	}
	return database.InTx(ctx, s.store.DB, func(tx pgx.Tx) error {
		return s.addLedger(ctx, tx, walletID, "release_reserve", amount, -amount, reason, nil)
	})
}

type UsageSettlement struct {
	UserWalletID          string
	ProviderPublicID      string
	ReservedCredits       int64
	ActualCostCredits     int64
	ProviderRewardCredits int64
	JobID                 string
	ProjectID             string
	UserID                string
	ModelID               string
	ProviderID            string
	ProviderInstanceID    string
	InputTokens           int
	OutputTokens          int
	TokenSource           string
	LatencyMS             int
}

func (s *WalletService) FinalizeUsage(ctx context.Context, in UsageSettlement) error {
	if in.ReservedCredits < 0 || in.ActualCostCredits < 0 || in.ProviderRewardCredits < 0 {
		return ErrInvalidInput
	}
	if in.TokenSource == "" {
		in.TokenSource = "server_estimated"
	}
	return database.InTx(ctx, s.store.DB, func(tx pgx.Tx) error {
		if in.ReservedCredits > 0 {
			if err := s.addLedger(ctx, tx, in.UserWalletID, "release_reserve", in.ReservedCredits, -in.ReservedCredits, "release_usage_reservation", nil); err != nil {
				return err
			}
		}
		if in.ActualCostCredits > 0 {
			if err := s.addLedger(ctx, tx, in.UserWalletID, "debit_usage", -in.ActualCostCredits, 0, "chat_completion_usage", nil); err != nil {
				return err
			}
		}
		if in.ProviderRewardCredits > 0 {
			if err := s.addLedger(ctx, tx, in.UserWalletID, "credit_provider_reward", in.ProviderRewardCredits, 0, "chat_completion_provider_reward", nil); err != nil {
				return err
			}
		}
		_, err := tx.Exec(ctx, `INSERT INTO usage_records (public_id, job_id, project_id, user_id, model_id, provider_id, provider_instance_id, input_tokens, output_tokens, total_tokens, token_source, cost_credits, provider_reward_credits, latency_ms) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, auth.PublicID("use"), in.JobID, in.ProjectID, in.UserID, in.ModelID, in.ProviderID, in.ProviderInstanceID, in.InputTokens, in.OutputTokens, in.InputTokens+in.OutputTokens, in.TokenSource, in.ActualCostCredits, in.ProviderRewardCredits, in.LatencyMS)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `UPDATE inference_jobs SET status='succeeded', actual_cost_credits=$2, provider_reward_credits=$3, completed_at=now() WHERE id=$1`, in.JobID, in.ActualCostCredits, in.ProviderRewardCredits); err != nil {
			return err
		}
		_, err = tx.Exec(ctx, `WITH up AS (INSERT INTO provider_stats (provider_id, total_jobs, succeeded_jobs, avg_latency_ms, success_rate, trust_score) VALUES ($1,1,1,$2,1,LEAST(100, 70 + GREATEST(0, 20 - $2::numeric / 500))) ON CONFLICT (provider_id) DO UPDATE SET total_jobs=provider_stats.total_jobs+1, succeeded_jobs=provider_stats.succeeded_jobs+1, avg_latency_ms=CASE WHEN provider_stats.avg_latency_ms IS NULL THEN $2 ELSE ((provider_stats.avg_latency_ms * provider_stats.succeeded_jobs) + $2) / (provider_stats.succeeded_jobs + 1) END, updated_at=now() RETURNING provider_id) UPDATE provider_stats SET success_rate = CASE WHEN total_jobs=0 THEN 0 ELSE succeeded_jobs::numeric / total_jobs END, trust_score = LEAST(100, GREATEST(0, (CASE WHEN total_jobs=0 THEN 0 ELSE succeeded_jobs::numeric / total_jobs END) * 70 + GREATEST(0, 20 - COALESCE(avg_latency_ms, 2500) / 500))) WHERE provider_id IN (SELECT provider_id FROM up)`, in.ProviderID, in.LatencyMS)
		return err
	})
}

func (s *WalletService) addLedger(ctx context.Context, tx pgx.Tx, walletID, entryType string, amount, reservedDelta int64, reason string, createdBy *string) error {
	var balance, reserved int64
	if err := tx.QueryRow(ctx, `SELECT balance_credits, reserved_credits FROM wallets WHERE id=$1 FOR UPDATE`, walletID).Scan(&balance, &reserved); err != nil {
		return err
	}
	balance += amount
	reserved += reservedDelta
	if balance < 0 || reserved < 0 {
		return ErrInsufficientCredits
	}
	if _, err := tx.Exec(ctx, `UPDATE wallets SET balance_credits=$1, reserved_credits=$2, updated_at=now() WHERE id=$3`, balance, reserved, walletID); err != nil {
		return err
	}
	var createdByValue any
	if createdBy != nil {
		createdByValue = *createdBy
	}
	_, err := tx.Exec(ctx, `INSERT INTO wallet_ledger (public_id,wallet_id,entry_type,amount_credits,reserved_delta,balance_after,reserved_after,reason,created_by_user_id) VALUES ($1,$2::uuid,$3,$4,$5,$6,$7,$8,$9::uuid)`, auth.PublicID("led"), walletID, entryType, amount, reservedDelta, balance, reserved, reason, createdByValue)
	return err
}

func PriceCredits(inputTokens, outputTokens int, inputPer1K, outputPer1K int64) int64 {
	return int64(math.Ceil(float64(inputTokens)*float64(inputPer1K)/1000)) + int64(math.Ceil(float64(outputTokens)*float64(outputPer1K)/1000))
}

func ProviderReward(cost int64, ratio float64) int64 { return int64(math.Floor(float64(cost) * ratio)) }

type ProjectService struct{ store *repository.Store }

func (s *ProjectService) Create(ctx context.Context, user domain.User, name string, limit *int64) (domain.Project, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return domain.Project{}, ErrInvalidInput
	}
	return s.store.CreateProject(ctx, user.ID, auth.PublicID("prj"), name, limit)
}
func (s *ProjectService) List(ctx context.Context, user domain.User) ([]domain.Project, error) {
	return s.store.ProjectsByOwner(ctx, user.ID)
}
func (s *ProjectService) CreateAPIKey(ctx context.Context, user domain.User, projectPublicID, name, pepper string) (domain.APIKey, string, error) {
	project, err := s.store.ProjectByPublicIDForOwner(ctx, user.ID, projectPublicID)
	if err != nil {
		return domain.APIKey{}, "", err
	}
	plaintext, prefix, publicID, err := auth.GenerateAPIKey()
	if err != nil {
		return domain.APIKey{}, "", err
	}
	name = strings.TrimSpace(name)
	if name == "" {
		return domain.APIKey{}, "", ErrInvalidInput
	}
	key, err := s.store.CreateAPIKey(ctx, publicID, project.ID, name, prefix, auth.HashToken(pepper, plaintext))
	return key, plaintext, err
}
func (s *ProjectService) APIKeys(ctx context.Context, user domain.User, projectPublicID string) ([]domain.APIKey, error) {
	project, err := s.store.ProjectByPublicIDForOwner(ctx, user.ID, projectPublicID)
	if err != nil {
		return nil, err
	}
	return s.store.APIKeysByProject(ctx, project.ID)
}
func (s *ProjectService) RevokeAPIKey(ctx context.Context, user domain.User, projectPublicID, keyPublicID string) error {
	project, err := s.store.ProjectByPublicIDForOwner(ctx, user.ID, projectPublicID)
	if err != nil {
		return err
	}
	return s.store.RevokeAPIKey(ctx, project.ID, keyPublicID)
}

type UsageService struct{ store *repository.Store }

func (s *UsageService) List(ctx context.Context, user domain.User, filter domain.UsageFilter) ([]domain.UsageRecord, error) {
	filter.ProjectPublicID = strings.TrimSpace(filter.ProjectPublicID)
	filter.ModelSlug = strings.TrimSpace(filter.ModelSlug)
	if filter.From != nil && filter.To != nil && filter.From.After(*filter.To) {
		return nil, ErrInvalidInput
	}
	return s.store.UsageByOwner(ctx, user.ID, filter)
}

type ModelService struct{ store *repository.Store }

func (s *ModelService) Active(ctx context.Context) ([]domain.Model, error) {
	return s.store.ActiveModels(ctx)
}

type ProviderService struct {
	cfg     config.Config
	store   *repository.Store
	wallets *WalletService
}
type ProviderInput struct {
	Name               string
	RegionHint         *string
	AllowAutoModelPull bool
}
type ProviderResult struct {
	Provider       domain.Provider
	PlaintextToken string
}

func (s *ProviderService) Create(ctx context.Context, user domain.User, in ProviderInput) (ProviderResult, error) {
	if strings.TrimSpace(in.Name) == "" {
		return ProviderResult{}, ErrInvalidInput
	}
	plaintext, prefix, publicID, err := auth.GenerateProviderToken()
	if err != nil {
		return ProviderResult{}, err
	}
	approval := "pending"
	if s.cfg.AllowDevAutoApproveProvider && s.cfg.AppEnv == "development" {
		approval = "approved"
	}
	var out ProviderResult
	err = database.InTx(ctx, s.store.DB, func(tx pgx.Tx) error {
		p, err := s.store.CreateProvider(ctx, tx, publicID, user.ID, strings.TrimSpace(in.Name), in.RegionHint, in.AllowAutoModelPull, prefix, auth.HashToken(s.cfg.ProviderTokenPepper, plaintext), approval)
		if err != nil {
			return err
		}
		w, err := s.store.CreateWallet(ctx, tx, auth.PublicID("wal"), "provider", p.ID)
		if err != nil {
			return err
		}
		if err := s.store.SetProviderWallet(ctx, tx, p.ID, w.ID); err != nil {
			return err
		}
		out.Provider = p
		out.PlaintextToken = plaintext
		return nil
	})
	return out, err
}
func (s *ProviderService) List(ctx context.Context, user domain.User) ([]domain.Provider, error) {
	return s.store.ProvidersByOwner(ctx, user.ID)
}

func (s *ProviderService) ListWithInstance(ctx context.Context, user domain.User) ([]domain.ProviderWithInstance, error) {
	return s.store.ProvidersWithInstance(ctx, user.ID)
}

func (s *ProviderService) ResolveToken(ctx context.Context, token string) (domain.Provider, error) {
	if !strings.HasPrefix(token, "pvn_provider_") {
		return domain.Provider{}, ErrInvalidCredentials
	}
	return s.store.ResolveProviderToken(ctx, auth.HashToken(s.cfg.ProviderTokenPepper, token))
}

func (s *ProviderService) UpsertInstance(ctx context.Context, provider domain.Provider, instanceKey, hostname, osName, arch, appVersion string) (domain.ProviderInstance, error) {
	if strings.TrimSpace(instanceKey) == "" {
		return domain.ProviderInstance{}, ErrInvalidInput
	}
	return s.store.UpsertProviderInstance(ctx, provider.ID, auth.PublicID("pin"), instanceKey, hostname, osName, arch, appVersion)
}

func (s *ProviderService) Heartbeat(ctx context.Context, instance domain.ProviderInstance, status string, currentJobID *string) error {
	if status != "online" && status != "busy" && status != "draining" {
		return ErrInvalidInput
	}
	return s.store.UpdateProviderHeartbeat(ctx, instance.ID, status, currentJobID)
}

func (s *ProviderService) HardwareReport(ctx context.Context, instance domain.ProviderInstance, cpuModel string, ramMB int, gpuName string, gpuVRAMMB int, gpuDriver string, raw []byte) error {
	return s.store.InsertHardwareReport(ctx, instance.ID, cpuModel, ramMB, gpuName, gpuVRAMMB, gpuDriver, raw)
}

func (s *ProviderService) ModelList(ctx context.Context, provider domain.Provider, instance domain.ProviderInstance, runtime string, models map[string]string) error {
	if runtime == "" {
		runtime = "ollama"
	}
	for name, digest := range models {
		if strings.TrimSpace(name) == "" {
			continue
		}
		if err := s.store.UpsertProviderModelAdvertisement(ctx, provider.ID, instance.ID, runtime, name, digest); err != nil {
			return err
		}
	}
	return nil
}

func (s *ProviderService) OfflineCutoff(now time.Time) time.Time {
	return now.UTC().Add(-s.cfg.ProviderHeartbeatTimeout)
}

func (s *ProviderService) MarkOfflineTimedOut(ctx context.Context, now time.Time) (int64, error) {
	return s.store.MarkStaleProviderInstancesOffline(ctx, s.OfflineCutoff(now))
}

type OpenAIService struct {
	cfg   config.Config
	store *repository.Store
}

func (s *OpenAIService) ResolveAPIKey(ctx context.Context, token string) (repository.APIKeyAuth, error) {
	if !auth.ValidAPIKeyFormat(token) {
		return repository.APIKeyAuth{}, ErrInvalidCredentials
	}
	return s.store.ResolveAPIKey(ctx, auth.HashToken(s.cfg.APIKeyPepper, token))
}
func (s *OpenAIService) Model(ctx context.Context, slug string) (domain.Model, error) {
	return s.store.ActiveModelBySlug(ctx, slug)
}

func (s *OpenAIService) FindProvider(ctx context.Context, modelID string) (repository.RoutableProvider, error) {
	return s.store.FindRoutableProvider(ctx, modelID)
}

func (s *OpenAIService) CreateJob(ctx context.Context, publicID string, auth repository.APIKeyAuth, model domain.Model, route repository.RoutableProvider, requestID string, inputTokens, outputTokens int, reservedCredits int64) (string, error) {
	return s.store.CreateInferenceJob(ctx, publicID, auth.Project.ID, auth.User.ID, auth.APIKeyID, model.ID, route.ModelVersionID, route.ProviderID, route.ProviderInstanceID, requestID, inputTokens, outputTokens, reservedCredits)
}

func (s *OpenAIService) MarkJobDispatched(ctx context.Context, jobID string) error {
	return s.store.MarkJobDispatched(ctx, jobID)
}

func (s *OpenAIService) MarkJobFailed(ctx context.Context, jobID, status, code, message string) error {
	return s.store.MarkJobFailed(ctx, jobID, status, code, message)
}

type AdminService struct {
	store   *repository.Store
	wallets *WalletService
}

func (s *AdminService) Models(ctx context.Context, user domain.User) ([]domain.Model, error) {
	if user.Role != "admin" {
		return nil, ErrForbidden
	}
	return s.store.AllModels(ctx)
}

func (s *AdminService) CreateModel(ctx context.Context, user domain.User, in domain.ModelInput) (domain.Model, error) {
	if user.Role != "admin" {
		return domain.Model{}, ErrForbidden
	}
	in = normalizeModelInput(in)
	if !validModelInput(in) {
		return domain.Model{}, ErrInvalidInput
	}
	return s.store.CreateModel(ctx, user.ID, auth.PublicID("mdl"), in)
}

func (s *AdminService) UpdateModel(ctx context.Context, user domain.User, modelPublicID string, in domain.ModelPatch) (domain.Model, error) {
	if user.Role != "admin" {
		return domain.Model{}, ErrForbidden
	}
	in = normalizeModelPatch(in)
	if !validModelPatch(in) {
		return domain.Model{}, ErrInvalidInput
	}
	return s.store.UpdateModel(ctx, user.ID, modelPublicID, in)
}

func (s *AdminService) PauseModel(ctx context.Context, user domain.User, modelPublicID string) error {
	if user.Role != "admin" {
		return ErrForbidden
	}
	return s.store.PauseModel(ctx, user.ID, modelPublicID)
}

func (s *AdminService) Jobs(ctx context.Context, user domain.User) ([]domain.AdminJob, error) {
	if user.Role != "admin" {
		return nil, ErrForbidden
	}
	return s.store.AdminJobs(ctx)
}

func (s *AdminService) Usage(ctx context.Context, user domain.User) ([]domain.AdminUsageRecord, error) {
	if user.Role != "admin" {
		return nil, ErrForbidden
	}
	return s.store.AdminUsage(ctx)
}

func (s *AdminService) AdjustWallet(ctx context.Context, user domain.User, targetUserPublicID string, amount int64, reason string) (domain.Wallet, error) {
	if user.Role != "admin" {
		return domain.Wallet{}, ErrForbidden
	}
	return s.wallets.AdminAdjust(ctx, user.ID, targetUserPublicID, amount, reason)
}

func (s *AdminService) Providers(ctx context.Context, user domain.User) ([]domain.Provider, error) {
	if user.Role != "admin" {
		return nil, ErrForbidden
	}
	return s.store.AllProviders(ctx)
}

func (s *AdminService) SetProviderApproval(ctx context.Context, user domain.User, providerPublicID, status string) error {
	if user.Role != "admin" {
		return ErrForbidden
	}
	if status != "approved" && status != "rejected" {
		return ErrInvalidInput
	}
	return s.store.UpdateProviderApproval(ctx, user.ID, providerPublicID, status)
}

func (s *AdminService) DisableProvider(ctx context.Context, user domain.User, providerPublicID string) error {
	if user.Role != "admin" {
		return ErrForbidden
	}
	return s.store.DisableProvider(ctx, user.ID, providerPublicID)
}

func (s *AdminService) AuditLog(ctx context.Context, user domain.User) ([]domain.AdminAuditLogEntry, error) {
	if user.Role != "admin" {
		return nil, ErrForbidden
	}
	return s.store.AdminAuditLog(ctx)
}

func (s *AdminService) PendingProviderModelAdvertisements(ctx context.Context, user domain.User) ([]domain.ProviderModelAdvertisement, error) {
	if user.Role != "admin" {
		return nil, ErrForbidden
	}
	return s.store.PendingProviderModelAdvertisements(ctx)
}

func (s *AdminService) SetProviderModelAdvertisementStatus(ctx context.Context, user domain.User, publicID, status string) error {
	if user.Role != "admin" {
		return ErrForbidden
	}
	if status != "approved" && status != "rejected" {
		return ErrInvalidInput
	}
	return s.store.UpdateProviderModelAdvertisementStatus(ctx, user.ID, publicID, status)
}

func normalizeModelInput(in domain.ModelInput) domain.ModelInput {
	in.Slug = strings.TrimSpace(in.Slug)
	in.DisplayName = strings.TrimSpace(in.DisplayName)
	in.Description = strings.TrimSpace(in.Description)
	in.Family = strings.TrimSpace(in.Family)
	in.Modality = strings.TrimSpace(in.Modality)
	in.Status = strings.TrimSpace(in.Status)
	in.LicenseName = strings.TrimSpace(in.LicenseName)
	in.LicenseNotes = strings.TrimSpace(in.LicenseNotes)
	if in.Modality == "" {
		in.Modality = "text"
	}
	if in.Status == "" {
		in.Status = "active"
	}
	if in.ContextLength == 0 {
		in.ContextLength = 4096
	}
	if in.DefaultMaxOutputTokens == 0 {
		in.DefaultMaxOutputTokens = 1024
	}
	if in.InputCreditPer1K == 0 {
		in.InputCreditPer1K = 10
	}
	if in.OutputCreditPer1K == 0 {
		in.OutputCreditPer1K = 20
	}
	if in.ProviderRewardRatio == 0 {
		in.ProviderRewardRatio = 0.7
	}
	if in.MinVRAMMB == 0 {
		in.MinVRAMMB = 8192
	}
	if in.RecommendedVRAMMB == 0 {
		in.RecommendedVRAMMB = 12288
	}
	if in.LicenseName == "" {
		in.LicenseName = "unknown"
	}
	return in
}

func normalizeModelPatch(in domain.ModelPatch) domain.ModelPatch {
	trim := func(s *string) *string {
		if s == nil {
			return nil
		}
		v := strings.TrimSpace(*s)
		return &v
	}
	in.Slug = trim(in.Slug)
	in.DisplayName = trim(in.DisplayName)
	in.Description = trim(in.Description)
	in.Family = trim(in.Family)
	in.Modality = trim(in.Modality)
	in.Status = trim(in.Status)
	in.LicenseName = trim(in.LicenseName)
	in.LicenseNotes = trim(in.LicenseNotes)
	return in
}

func validModelInput(in domain.ModelInput) bool {
	return in.Slug != "" && in.DisplayName != "" && in.Family != "" && validModality(in.Modality) && validModelStatus(in.Status) && in.ContextLength > 0 && in.DefaultMaxOutputTokens > 0 && in.InputCreditPer1K >= 0 && in.OutputCreditPer1K >= 0 && in.ProviderRewardRatio >= 0 && in.ProviderRewardRatio <= 1 && in.MinVRAMMB >= 0 && in.RecommendedVRAMMB >= 0
}

func validModelPatch(in domain.ModelPatch) bool {
	if in.Slug != nil && *in.Slug == "" || in.DisplayName != nil && *in.DisplayName == "" || in.Family != nil && *in.Family == "" {
		return false
	}
	if in.Modality != nil && !validModality(*in.Modality) || in.Status != nil && !validModelStatus(*in.Status) {
		return false
	}
	if in.ContextLength != nil && *in.ContextLength <= 0 || in.DefaultMaxOutputTokens != nil && *in.DefaultMaxOutputTokens <= 0 || in.InputCreditPer1K != nil && *in.InputCreditPer1K < 0 || in.OutputCreditPer1K != nil && *in.OutputCreditPer1K < 0 || in.ProviderRewardRatio != nil && (*in.ProviderRewardRatio < 0 || *in.ProviderRewardRatio > 1) || in.MinVRAMMB != nil && *in.MinVRAMMB < 0 || in.RecommendedVRAMMB != nil && *in.RecommendedVRAMMB < 0 {
		return false
	}
	return true
}

func validModality(v string) bool {
	return v == "text" || v == "embedding" || v == "image" || v == "audio"
}

func validModelStatus(v string) bool {
	return v == "active" || v == "paused" || v == "deprecated"
}

var ErrInvalidInput = errors.New("invalid input")
