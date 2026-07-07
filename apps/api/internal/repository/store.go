package repository

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nuvonode/nuvonode/apps/api/internal/auth"
	"github.com/nuvonode/nuvonode/apps/api/internal/domain"
)

var ErrNotFound = errors.New("not found")

type Store struct{ DB *pgxpool.Pool }

func NewStore(db *pgxpool.Pool) *Store { return &Store{DB: db} }

func (s *Store) CountUsers(ctx context.Context, tx pgx.Tx) (int, error) {
	var n int
	err := tx.QueryRow(ctx, `SELECT count(*) FROM users WHERE deleted_at IS NULL`).Scan(&n)
	return n, err
}

func (s *Store) CreateUser(ctx context.Context, tx pgx.Tx, publicID, email, passwordHash, displayName, role string) (domain.User, error) {
	var u domain.User
	err := tx.QueryRow(ctx, `INSERT INTO users (public_id,email,password_hash,display_name,role) VALUES ($1,$2,$3,$4,$5) RETURNING id::text, public_id, email, password_hash, display_name, role, status, created_at`, publicID, email, passwordHash, displayName, role).Scan(&u.ID, &u.PublicID, &u.Email, &u.PasswordHash, &u.DisplayName, &u.Role, &u.Status, &u.CreatedAt)
	return u, err
}

func (s *Store) UserByEmail(ctx context.Context, email string) (domain.User, error) {
	var u domain.User
	err := s.DB.QueryRow(ctx, `SELECT id::text, public_id, email, password_hash, display_name, role, status, created_at FROM users WHERE email=$1 AND deleted_at IS NULL`, email).Scan(&u.ID, &u.PublicID, &u.Email, &u.PasswordHash, &u.DisplayName, &u.Role, &u.Status, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return u, ErrNotFound
	}
	return u, err
}

func (s *Store) UserByPublicID(ctx context.Context, publicID string) (domain.User, error) {
	var u domain.User
	err := s.DB.QueryRow(ctx, `SELECT id::text, public_id, email, password_hash, display_name, role, status, created_at FROM users WHERE public_id=$1 AND deleted_at IS NULL`, publicID).Scan(&u.ID, &u.PublicID, &u.Email, &u.PasswordHash, &u.DisplayName, &u.Role, &u.Status, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return u, ErrNotFound
	}
	return u, err
}

func (s *Store) CreateWallet(ctx context.Context, tx pgx.Tx, publicID, ownerType, ownerID string) (domain.Wallet, error) {
	var w domain.Wallet
	err := tx.QueryRow(ctx, `INSERT INTO wallets (public_id, owner_type, owner_id) VALUES ($1,$2,$3) RETURNING id::text, public_id, owner_type, owner_id::text, balance_credits, reserved_credits`, publicID, ownerType, ownerID).Scan(&w.ID, &w.PublicID, &w.OwnerType, &w.OwnerID, &w.BalanceCredits, &w.ReservedCredits)
	return w, err
}

func (s *Store) WalletByOwner(ctx context.Context, ownerType, ownerPublicID string) (domain.Wallet, error) {
	var w domain.Wallet
	err := s.DB.QueryRow(ctx, `SELECT w.id::text, w.public_id, w.owner_type, w.owner_id::text, w.balance_credits, w.reserved_credits FROM wallets w JOIN users u ON w.owner_type='user' AND w.owner_id=u.id WHERE u.public_id=$1 AND $2='user'`, ownerPublicID, ownerType).Scan(&w.ID, &w.PublicID, &w.OwnerType, &w.OwnerID, &w.BalanceCredits, &w.ReservedCredits)
	if errors.Is(err, pgx.ErrNoRows) {
		return w, ErrNotFound
	}
	return w, err
}

func (s *Store) LedgerForWallet(ctx context.Context, walletID string) ([]domain.LedgerEntry, error) {
	rows, err := s.DB.Query(ctx, `SELECT public_id, entry_type, amount_credits, reserved_delta, balance_after, reserved_after, reason, created_at FROM wallet_ledger WHERE wallet_id=$1 ORDER BY created_at DESC LIMIT 100`, walletID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.LedgerEntry
	for rows.Next() {
		var e domain.LedgerEntry
		if err := rows.Scan(&e.PublicID, &e.EntryType, &e.AmountCredits, &e.ReservedDelta, &e.BalanceAfter, &e.ReservedAfter, &e.Reason, &e.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func (s *Store) CreateProject(ctx context.Context, ownerUserID, publicID, name string, limit *int64) (domain.Project, error) {
	var p domain.Project
	err := s.DB.QueryRow(ctx, `INSERT INTO projects (public_id, owner_user_id, name, monthly_credit_limit) VALUES ($1,$2,$3,$4) RETURNING id::text, public_id, owner_user_id::text, name, status, monthly_credit_limit, current_month_spend, spend_period, created_at`, publicID, ownerUserID, name, limit).Scan(&p.ID, &p.PublicID, &p.OwnerUserID, &p.Name, &p.Status, &p.MonthlyCreditLimit, &p.CurrentMonthSpend, &p.SpendPeriod, &p.CreatedAt)
	return p, err
}

func (s *Store) ProjectsByOwner(ctx context.Context, ownerUserID string) ([]domain.Project, error) {
	rows, err := s.DB.Query(ctx, `SELECT id::text, public_id, owner_user_id::text, name, status, monthly_credit_limit, current_month_spend, spend_period, created_at FROM projects WHERE owner_user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, ownerUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Project
	for rows.Next() {
		var p domain.Project
		if err := rows.Scan(&p.ID, &p.PublicID, &p.OwnerUserID, &p.Name, &p.Status, &p.MonthlyCreditLimit, &p.CurrentMonthSpend, &p.SpendPeriod, &p.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) ProjectByPublicIDForOwner(ctx context.Context, ownerUserID, projectPublicID string) (domain.Project, error) {
	var p domain.Project
	err := s.DB.QueryRow(ctx, `SELECT id::text, public_id, owner_user_id::text, name, status, monthly_credit_limit, current_month_spend, spend_period, created_at FROM projects WHERE owner_user_id=$1 AND public_id=$2 AND deleted_at IS NULL`, ownerUserID, projectPublicID).Scan(&p.ID, &p.PublicID, &p.OwnerUserID, &p.Name, &p.Status, &p.MonthlyCreditLimit, &p.CurrentMonthSpend, &p.SpendPeriod, &p.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return p, ErrNotFound
	}
	return p, err
}

func (s *Store) CreateAPIKey(ctx context.Context, publicID, projectID, name, prefix, keyHash string) (domain.APIKey, error) {
	var k domain.APIKey
	err := s.DB.QueryRow(ctx, `INSERT INTO api_keys (public_id, project_id, name, prefix, key_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id::text, public_id, project_id::text, name, prefix, status, created_at`, publicID, projectID, name, prefix, keyHash).Scan(&k.ID, &k.PublicID, &k.ProjectID, &k.Name, &k.Prefix, &k.Status, &k.CreatedAt)
	return k, err
}

func (s *Store) APIKeysByProject(ctx context.Context, projectID string) ([]domain.APIKey, error) {
	rows, err := s.DB.Query(ctx, `SELECT id::text, public_id, project_id::text, name, prefix, status, created_at FROM api_keys WHERE project_id=$1 ORDER BY created_at DESC`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.APIKey
	for rows.Next() {
		var k domain.APIKey
		if err := rows.Scan(&k.ID, &k.PublicID, &k.ProjectID, &k.Name, &k.Prefix, &k.Status, &k.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, k)
	}
	return out, rows.Err()
}

func (s *Store) RevokeAPIKey(ctx context.Context, projectID, keyPublicID string) error {
	cmd, err := s.DB.Exec(ctx, `UPDATE api_keys SET status='revoked', revoked_at=now() WHERE project_id=$1 AND public_id=$2 AND status='active'`, projectID, keyPublicID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

type APIKeyAuth struct {
	User     domain.User
	Project  domain.Project
	APIKeyID string
}

func (s *Store) ResolveAPIKey(ctx context.Context, keyHash string) (APIKeyAuth, error) {
	var a APIKeyAuth
	err := s.DB.QueryRow(ctx, `SELECT u.id::text,u.public_id,u.email,u.password_hash,u.display_name,u.role,u.status,u.created_at,p.id::text,p.public_id,p.owner_user_id::text,p.name,p.status,p.monthly_credit_limit,p.current_month_spend,p.spend_period,p.created_at,k.id::text FROM api_keys k JOIN projects p ON p.id=k.project_id JOIN users u ON u.id=p.owner_user_id WHERE k.key_hash=$1 AND k.status='active' AND p.status='active' AND p.deleted_at IS NULL AND u.status='active' AND u.deleted_at IS NULL`, keyHash).Scan(&a.User.ID, &a.User.PublicID, &a.User.Email, &a.User.PasswordHash, &a.User.DisplayName, &a.User.Role, &a.User.Status, &a.User.CreatedAt, &a.Project.ID, &a.Project.PublicID, &a.Project.OwnerUserID, &a.Project.Name, &a.Project.Status, &a.Project.MonthlyCreditLimit, &a.Project.CurrentMonthSpend, &a.Project.SpendPeriod, &a.Project.CreatedAt, &a.APIKeyID)
	if errors.Is(err, pgx.ErrNoRows) {
		return a, ErrNotFound
	}
	if err == nil {
		_, _ = s.DB.Exec(ctx, `UPDATE api_keys SET last_used_at=now() WHERE id=$1`, a.APIKeyID)
	}
	return a, err
}

const modelSelect = `id::text, public_id, slug, display_name, description, family, modality, status, context_length, default_max_output_tokens, input_credit_per_1k, output_credit_per_1k, provider_reward_ratio::float8, min_vram_mb, recommended_vram_mb, license_name, license_url, license_notes, community_allowed, external_only, created_at`

func scanModel(row pgx.Row) (domain.Model, error) {
	var m domain.Model
	err := row.Scan(&m.ID, &m.PublicID, &m.Slug, &m.DisplayName, &m.Description, &m.Family, &m.Modality, &m.Status, &m.ContextLength, &m.DefaultMaxOutputTokens, &m.InputCreditPer1K, &m.OutputCreditPer1K, &m.ProviderRewardRatio, &m.MinVRAMMB, &m.RecommendedVRAMMB, &m.LicenseName, &m.LicenseURL, &m.LicenseNotes, &m.CommunityAllowed, &m.ExternalOnly, &m.CreatedAt)
	return m, err
}

func (s *Store) ActiveModels(ctx context.Context) ([]domain.Model, error) {
	rows, err := s.DB.Query(ctx, `SELECT `+modelSelect+` FROM models WHERE status='active' AND deleted_at IS NULL ORDER BY slug`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.Model{}
	for rows.Next() {
		m, err := scanModel(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) ActiveModelBySlug(ctx context.Context, slug string) (domain.Model, error) {
	m, err := scanModel(s.DB.QueryRow(ctx, `SELECT `+modelSelect+` FROM models WHERE slug=$1 AND status='active' AND deleted_at IS NULL`, slug))
	if errors.Is(err, pgx.ErrNoRows) {
		return m, ErrNotFound
	}
	return m, err
}

func (s *Store) AllModels(ctx context.Context) ([]domain.Model, error) {
	rows, err := s.DB.Query(ctx, `SELECT `+modelSelect+` FROM models WHERE deleted_at IS NULL ORDER BY slug`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.Model{}
	for rows.Next() {
		m, err := scanModel(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) CreateModel(ctx context.Context, actorUserID, publicID string, in domain.ModelInput) (domain.Model, error) {
	m, err := scanModel(s.DB.QueryRow(ctx, `WITH inserted AS (INSERT INTO models (public_id, slug, display_name, description, family, modality, status, context_length, default_max_output_tokens, input_credit_per_1k, output_credit_per_1k, provider_reward_ratio, min_vram_mb, recommended_vram_mb, license_name, license_url, license_notes, community_allowed, external_only) VALUES ($2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING `+modelSelect+`), audit AS (INSERT INTO audit_log (public_id, actor_user_id, action, target_type, target_id, metadata) SELECT $21, $1::uuid, 'model_created', 'model', id::uuid, jsonb_build_object('slug', slug) FROM inserted) SELECT * FROM inserted`, actorUserID, publicID, in.Slug, in.DisplayName, in.Description, in.Family, in.Modality, in.Status, in.ContextLength, in.DefaultMaxOutputTokens, in.InputCreditPer1K, in.OutputCreditPer1K, in.ProviderRewardRatio, in.MinVRAMMB, in.RecommendedVRAMMB, in.LicenseName, in.LicenseURL, in.LicenseNotes, in.CommunityAllowed, in.ExternalOnly, authPublicID("aud")))
	return m, err
}

func (s *Store) UpdateModel(ctx context.Context, actorUserID, modelPublicID string, in domain.ModelPatch) (domain.Model, error) {
	m, err := scanModel(s.DB.QueryRow(ctx, `WITH updated AS (UPDATE models SET slug=COALESCE($3, slug), display_name=COALESCE($4, display_name), description=COALESCE($5, description), family=COALESCE($6, family), modality=COALESCE($7, modality), status=COALESCE($8, status), context_length=COALESCE($9, context_length), default_max_output_tokens=COALESCE($10, default_max_output_tokens), input_credit_per_1k=COALESCE($11, input_credit_per_1k), output_credit_per_1k=COALESCE($12, output_credit_per_1k), provider_reward_ratio=COALESCE($13, provider_reward_ratio), min_vram_mb=COALESCE($14, min_vram_mb), recommended_vram_mb=COALESCE($15, recommended_vram_mb), license_name=COALESCE($16, license_name), license_url=COALESCE($17, license_url), license_notes=COALESCE($18, license_notes), community_allowed=COALESCE($19, community_allowed), external_only=COALESCE($20, external_only), updated_at=now() WHERE public_id=$2 AND deleted_at IS NULL RETURNING `+modelSelect+`), audit AS (INSERT INTO audit_log (public_id, actor_user_id, action, target_type, target_id, metadata) SELECT $21, $1::uuid, 'model_updated', 'model', id::uuid, jsonb_build_object('slug', slug) FROM updated) SELECT * FROM updated`, actorUserID, modelPublicID, in.Slug, in.DisplayName, in.Description, in.Family, in.Modality, in.Status, in.ContextLength, in.DefaultMaxOutputTokens, in.InputCreditPer1K, in.OutputCreditPer1K, in.ProviderRewardRatio, in.MinVRAMMB, in.RecommendedVRAMMB, in.LicenseName, in.LicenseURL, in.LicenseNotes, in.CommunityAllowed, in.ExternalOnly, authPublicID("aud")))
	if errors.Is(err, pgx.ErrNoRows) {
		return m, ErrNotFound
	}
	return m, err
}

func (s *Store) PauseModel(ctx context.Context, actorUserID, modelPublicID string) error {
	var id string
	err := s.DB.QueryRow(ctx, `WITH updated AS (UPDATE models SET status='paused', updated_at=now() WHERE public_id=$2 AND deleted_at IS NULL RETURNING id), audit AS (INSERT INTO audit_log (public_id, actor_user_id, action, target_type, target_id, metadata) SELECT $3, $1::uuid, 'model_paused', 'model', id, '{}'::jsonb FROM updated) SELECT id::text FROM updated`, actorUserID, modelPublicID, authPublicID("aud")).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func (s *Store) CreateProvider(ctx context.Context, tx pgx.Tx, publicID, ownerUserID, name string, regionHint *string, allowAuto bool, prefix, tokenHash, approval string) (domain.Provider, error) {
	var p domain.Provider
	err := tx.QueryRow(ctx, `INSERT INTO providers (public_id, owner_user_id, name, region_hint, approval_status, allow_auto_model_pull, token_prefix, token_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id::text, public_id, owner_user_id::text, name, region_hint, trust_level, approval_status, status, allow_auto_model_pull, token_prefix, created_at`, publicID, ownerUserID, name, regionHint, approval, allowAuto, prefix, tokenHash).Scan(&p.ID, &p.PublicID, &p.OwnerUserID, &p.Name, &p.RegionHint, &p.TrustLevel, &p.ApprovalStatus, &p.Status, &p.AllowAutoModelPull, &p.TokenPrefix, &p.CreatedAt)
	return p, err
}

func (s *Store) SetProviderWallet(ctx context.Context, tx pgx.Tx, providerID, walletID string) error {
	_, err := tx.Exec(ctx, `UPDATE providers SET wallet_id=$1 WHERE id=$2`, walletID, providerID)
	return err
}

func (s *Store) ProvidersByOwner(ctx context.Context, ownerUserID string) ([]domain.Provider, error) {
	rows, err := s.DB.Query(ctx, `SELECT id::text, public_id, owner_user_id::text, name, region_hint, trust_level, approval_status, status, allow_auto_model_pull, token_prefix, created_at FROM providers WHERE owner_user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, ownerUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.Provider{}
	for rows.Next() {
		var p domain.Provider
		if err := rows.Scan(&p.ID, &p.PublicID, &p.OwnerUserID, &p.Name, &p.RegionHint, &p.TrustLevel, &p.ApprovalStatus, &p.Status, &p.AllowAutoModelPull, &p.TokenPrefix, &p.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) ProvidersWithInstance(ctx context.Context, ownerUserID string) ([]domain.ProviderWithInstance, error) {
	rows, err := s.DB.Query(ctx, `SELECT p.id::text, p.public_id, p.owner_user_id::text, p.name, p.region_hint, p.trust_level, p.approval_status, p.status, p.allow_auto_model_pull, p.token_prefix, p.created_at, pi.status, pi.last_heartbeat_at, COALESCE(mds.models, '{}') FROM providers p LEFT JOIN LATERAL (SELECT status, last_heartbeat_at FROM provider_instances WHERE provider_id=p.id ORDER BY last_heartbeat_at DESC NULLS LAST LIMIT 1) pi ON true LEFT JOIN LATERAL (SELECT array_agg(DISTINCT pma.runtime_model_name ORDER BY pma.runtime_model_name) AS models FROM provider_model_advertisements pma WHERE pma.provider_id=p.id AND pma.status='approved') mds ON true WHERE p.owner_user_id=$1 AND p.deleted_at IS NULL ORDER BY p.created_at DESC`, ownerUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.ProviderWithInstance{}
	for rows.Next() {
		var p domain.ProviderWithInstance
		if err := rows.Scan(&p.ID, &p.PublicID, &p.OwnerUserID, &p.Name, &p.RegionHint, &p.TrustLevel, &p.ApprovalStatus, &p.Status, &p.AllowAutoModelPull, &p.TokenPrefix, &p.CreatedAt, &p.InstanceStatus, &p.InstanceHeartbeat, &p.ModelNames); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) ResolveProviderToken(ctx context.Context, tokenHash string) (domain.Provider, error) {
	var p domain.Provider
	err := s.DB.QueryRow(ctx, `SELECT id::text, public_id, owner_user_id::text, name, region_hint, trust_level, approval_status, status, allow_auto_model_pull, token_prefix, created_at FROM providers WHERE token_hash=$1 AND status='active' AND deleted_at IS NULL`, tokenHash).Scan(&p.ID, &p.PublicID, &p.OwnerUserID, &p.Name, &p.RegionHint, &p.TrustLevel, &p.ApprovalStatus, &p.Status, &p.AllowAutoModelPull, &p.TokenPrefix, &p.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return p, ErrNotFound
	}
	return p, err
}

func (s *Store) UpsertProviderInstance(ctx context.Context, providerID, publicID, instanceKey, hostname, osName, arch, appVersion string) (domain.ProviderInstance, error) {
	var i domain.ProviderInstance
	err := s.DB.QueryRow(ctx, `INSERT INTO provider_instances (public_id, provider_id, instance_key, hostname, os, arch, app_version, status, connected_at, last_heartbeat_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'online',now(),now()) ON CONFLICT (provider_id, instance_key) DO UPDATE SET hostname=EXCLUDED.hostname, os=EXCLUDED.os, arch=EXCLUDED.arch, app_version=EXCLUDED.app_version, status='online', connected_at=now(), last_heartbeat_at=now(), updated_at=now() RETURNING id::text, public_id, provider_id::text, instance_key, status, last_heartbeat_at, created_at`, publicID, providerID, instanceKey, hostname, osName, arch, appVersion).Scan(&i.ID, &i.PublicID, &i.ProviderID, &i.InstanceKey, &i.Status, &i.LastHeartbeatAt, &i.CreatedAt)
	return i, err
}

func (s *Store) UpdateProviderHeartbeat(ctx context.Context, instanceID, status string, currentJobID *string) error {
	if status == "" {
		status = "online"
	}
	_, err := s.DB.Exec(ctx, `UPDATE provider_instances SET status=$1, current_job_id=$2, last_heartbeat_at=now(), updated_at=now() WHERE id=$3`, status, currentJobID, instanceID)
	return err
}

func (s *Store) InsertHardwareReport(ctx context.Context, instanceID, cpuModel string, ramMB int, gpuName string, gpuVRAMMB int, gpuDriver string, raw []byte) error {
	if len(raw) == 0 {
		raw = []byte(`{}`)
	}
	_, err := s.DB.Exec(ctx, `INSERT INTO provider_hardware_reports (provider_instance_id, cpu_model, ram_mb, gpu_name, gpu_vram_mb, gpu_driver, raw) VALUES ($1,$2,$3,$4,$5,$6,$7)`, instanceID, cpuModel, ramMB, gpuName, gpuVRAMMB, gpuDriver, raw)
	return err
}

func (s *Store) UpsertProviderModelAdvertisement(ctx context.Context, providerID, instanceID, runtime, runtimeModelName, digest string) error {
	_, err := s.DB.Exec(ctx, `WITH matched AS (SELECT mv.model_id, mv.id AS model_version_id FROM model_versions mv WHERE mv.runtime=$4 AND mv.runtime_model_name=$5 AND mv.status='active' LIMIT 1), up AS (UPDATE provider_model_advertisements SET local_digest=$6, last_seen_at=now(), updated_at=now() WHERE provider_id=$2 AND provider_instance_id=$3 AND runtime=$4 AND runtime_model_name=$5 RETURNING id) INSERT INTO provider_model_advertisements (public_id, provider_id, provider_instance_id, model_id, model_version_id, runtime, runtime_model_name, local_digest, status, last_seen_at) SELECT $1, $2, $3, matched.model_id, matched.model_version_id, $4, $5, $6, 'pending', now() FROM (SELECT 1) seed LEFT JOIN matched ON true WHERE NOT EXISTS (SELECT 1 FROM up)`, authPublicID("pma"), providerID, instanceID, runtime, runtimeModelName, digest)
	return err
}

type RoutableProvider struct {
	ProviderID         string
	ProviderPublicID   string
	ProviderInstanceID string
	ModelVersionID     string
	RuntimeModelName   string
}

func (s *Store) FindRoutableProvider(ctx context.Context, modelID string) (RoutableProvider, error) {
	var out RoutableProvider
	err := s.DB.QueryRow(ctx, `SELECT p.id::text, p.public_id, pi.id::text, mv.id::text, mv.runtime_model_name FROM providers p JOIN provider_instances pi ON pi.provider_id=p.id JOIN provider_model_advertisements pma ON pma.provider_id=p.id AND pma.provider_instance_id=pi.id JOIN model_versions mv ON mv.id=pma.model_version_id WHERE p.approval_status='approved' AND p.status='active' AND pi.status='online' AND pma.status='approved' AND pma.model_id=$1 AND mv.status='active' ORDER BY pi.last_heartbeat_at DESC LIMIT 1`, modelID).Scan(&out.ProviderID, &out.ProviderPublicID, &out.ProviderInstanceID, &out.ModelVersionID, &out.RuntimeModelName)
	if errors.Is(err, pgx.ErrNoRows) {
		return out, ErrNotFound
	}
	return out, err
}

func (s *Store) CreateInferenceJob(ctx context.Context, publicID, projectID, userID, apiKeyID, modelID, modelVersionID, providerID, providerInstanceID, requestID string, inputTokens, outputTokens int, reservedCredits int64) (string, error) {
	var id string
	err := s.DB.QueryRow(ctx, `INSERT INTO inference_jobs (public_id, project_id, user_id, api_key_id, model_id, model_version_id, provider_id, provider_instance_id, status, request_id, estimated_input_tokens, estimated_output_tokens, reserved_credits) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'queued',$9,$10,$11,$12) RETURNING id::text`, publicID, projectID, userID, apiKeyID, modelID, modelVersionID, providerID, providerInstanceID, requestID, inputTokens, outputTokens, reservedCredits).Scan(&id)
	return id, err
}

func (s *Store) MarkJobDispatched(ctx context.Context, jobID string) error {
	_, err := s.DB.Exec(ctx, `UPDATE inference_jobs SET status='dispatched', dispatched_at=now() WHERE id=$1`, jobID)
	return err
}

func (s *Store) MarkJobFailed(ctx context.Context, jobID, status, code, message string) error {
	_, err := s.DB.Exec(ctx, `WITH updated AS (UPDATE inference_jobs SET status=$2, error_code=$3, error_message=$4, completed_at=now() WHERE id=$1 RETURNING provider_id), stats AS (INSERT INTO provider_stats (provider_id, total_jobs, failed_jobs, timeout_jobs, success_rate, trust_score) SELECT provider_id, 1, CASE WHEN $2='timed_out' THEN 0 ELSE 1 END, CASE WHEN $2='timed_out' THEN 1 ELSE 0 END, 0, 0 FROM updated WHERE provider_id IS NOT NULL ON CONFLICT (provider_id) DO UPDATE SET total_jobs=provider_stats.total_jobs+1, failed_jobs=provider_stats.failed_jobs + CASE WHEN $2='timed_out' THEN 0 ELSE 1 END, timeout_jobs=provider_stats.timeout_jobs + CASE WHEN $2='timed_out' THEN 1 ELSE 0 END, updated_at=now() RETURNING provider_id) UPDATE provider_stats SET success_rate = CASE WHEN total_jobs=0 THEN 0 ELSE succeeded_jobs::numeric / total_jobs END, trust_score = LEAST(100, GREATEST(0, (CASE WHEN total_jobs=0 THEN 0 ELSE succeeded_jobs::numeric / total_jobs END) * 70 + GREATEST(0, 20 - COALESCE(avg_latency_ms, 2500) / 500))) WHERE provider_id IN (SELECT provider_id FROM stats)`, jobID, status, code, message)
	return err
}

func (s *Store) AllProviders(ctx context.Context) ([]domain.Provider, error) {
	rows, err := s.DB.Query(ctx, `SELECT id::text, public_id, owner_user_id::text, name, region_hint, trust_level, approval_status, status, allow_auto_model_pull, token_prefix, created_at FROM providers WHERE deleted_at IS NULL ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.Provider{}
	for rows.Next() {
		var p domain.Provider
		if err := rows.Scan(&p.ID, &p.PublicID, &p.OwnerUserID, &p.Name, &p.RegionHint, &p.TrustLevel, &p.ApprovalStatus, &p.Status, &p.AllowAutoModelPull, &p.TokenPrefix, &p.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) UpdateProviderApproval(ctx context.Context, actorUserID, providerPublicID, approvalStatus string) error {
	var id string
	err := s.DB.QueryRow(ctx, `WITH updated AS (UPDATE providers SET approval_status=$3, updated_at=now() WHERE public_id=$2 AND deleted_at IS NULL RETURNING id), audit AS (INSERT INTO audit_log (public_id, actor_user_id, action, target_type, target_id, metadata) SELECT $4, $1::uuid, 'provider_' || $3, 'provider', id, jsonb_build_object('approval_status', $3) FROM updated) SELECT id::text FROM updated`, actorUserID, providerPublicID, approvalStatus, authPublicID("aud")).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func (s *Store) DisableProvider(ctx context.Context, actorUserID, providerPublicID string) error {
	var id string
	err := s.DB.QueryRow(ctx, `WITH updated AS (UPDATE providers SET status='disabled', updated_at=now() WHERE public_id=$2 AND deleted_at IS NULL RETURNING id), offline AS (UPDATE provider_instances SET status='offline', updated_at=now() WHERE provider_id IN (SELECT id FROM updated)), audit AS (INSERT INTO audit_log (public_id, actor_user_id, action, target_type, target_id, metadata) SELECT $3, $1::uuid, 'provider_disabled', 'provider', id, '{}'::jsonb FROM updated) SELECT id::text FROM updated`, actorUserID, providerPublicID, authPublicID("aud")).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func (s *Store) PendingProviderModelAdvertisements(ctx context.Context) ([]domain.ProviderModelAdvertisement, error) {
	rows, err := s.DB.Query(ctx, `SELECT id::text, public_id, provider_id::text, runtime, runtime_model_name, local_digest, status, created_at FROM provider_model_advertisements WHERE status='pending' ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.ProviderModelAdvertisement{}
	for rows.Next() {
		var ad domain.ProviderModelAdvertisement
		if err := rows.Scan(&ad.ID, &ad.PublicID, &ad.ProviderID, &ad.Runtime, &ad.RuntimeModelName, &ad.LocalDigest, &ad.Status, &ad.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, ad)
	}
	return out, rows.Err()
}

func (s *Store) UpdateProviderModelAdvertisementStatus(ctx context.Context, actorUserID, publicID, status string) error {
	var id string
	err := s.DB.QueryRow(ctx, `WITH updated AS (UPDATE provider_model_advertisements SET status=$3, updated_at=now() WHERE public_id=$2 RETURNING id), audit AS (INSERT INTO audit_log (public_id, actor_user_id, action, target_type, target_id, metadata) SELECT $4, $1::uuid, 'provider_model_advertisement_' || $3, 'provider_model_advertisement', id, jsonb_build_object('status', $3) FROM updated) SELECT id::text FROM updated`, actorUserID, publicID, status, authPublicID("aud")).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func (s *Store) AdminJobs(ctx context.Context) ([]domain.AdminJob, error) {
	rows, err := s.DB.Query(ctx, `SELECT j.public_id, p.public_id, u.public_id, m.public_id, m.slug, pr.public_id, pi.public_id, j.status, j.request_id, j.estimated_input_tokens, j.estimated_output_tokens, j.reserved_credits, j.actual_cost_credits, j.provider_reward_credits, j.error_code, j.error_message, j.created_at, j.dispatched_at, j.completed_at FROM inference_jobs j JOIN projects p ON p.id=j.project_id JOIN users u ON u.id=j.user_id JOIN models m ON m.id=j.model_id LEFT JOIN providers pr ON pr.id=j.provider_id LEFT JOIN provider_instances pi ON pi.id=j.provider_instance_id ORDER BY j.created_at DESC LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.AdminJob{}
	for rows.Next() {
		var j domain.AdminJob
		if err := rows.Scan(&j.PublicID, &j.ProjectID, &j.UserID, &j.ModelID, &j.ModelSlug, &j.ProviderID, &j.ProviderInstanceID, &j.Status, &j.RequestID, &j.EstimatedInputTokens, &j.EstimatedOutputTokens, &j.ReservedCredits, &j.ActualCostCredits, &j.ProviderRewardCredits, &j.ErrorCode, &j.ErrorMessage, &j.CreatedAt, &j.DispatchedAt, &j.CompletedAt); err != nil {
			return nil, err
		}
		out = append(out, j)
	}
	return out, rows.Err()
}

func (s *Store) AdminUsage(ctx context.Context) ([]domain.AdminUsageRecord, error) {
	rows, err := s.DB.Query(ctx, `SELECT ur.public_id, j.public_id, p.public_id, u.public_id, m.public_id, m.slug, pr.public_id, pi.public_id, ur.input_tokens, ur.output_tokens, ur.total_tokens, ur.token_source, ur.cost_credits, ur.provider_reward_credits, ur.latency_ms, ur.status, ur.created_at FROM usage_records ur JOIN inference_jobs j ON j.id=ur.job_id JOIN projects p ON p.id=ur.project_id JOIN users u ON u.id=ur.user_id JOIN models m ON m.id=ur.model_id LEFT JOIN providers pr ON pr.id=ur.provider_id LEFT JOIN provider_instances pi ON pi.id=ur.provider_instance_id ORDER BY ur.created_at DESC LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.AdminUsageRecord{}
	for rows.Next() {
		var r domain.AdminUsageRecord
		if err := rows.Scan(&r.PublicID, &r.JobID, &r.ProjectID, &r.UserID, &r.ModelID, &r.ModelSlug, &r.ProviderID, &r.ProviderInstanceID, &r.InputTokens, &r.OutputTokens, &r.TotalTokens, &r.TokenSource, &r.CostCredits, &r.ProviderRewardCredits, &r.LatencyMS, &r.Status, &r.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Store) AdminAuditLog(ctx context.Context) ([]domain.AdminAuditLogEntry, error) {
	rows, err := s.DB.Query(ctx, `SELECT aud.public_id, u.public_id, aud.action, aud.target_type, aud.target_id, aud.created_at FROM audit_log aud LEFT JOIN users u ON u.id=aud.actor_user_id ORDER BY aud.created_at DESC LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.AdminAuditLogEntry{}
	for rows.Next() {
		var e domain.AdminAuditLogEntry
		if err := rows.Scan(&e.PublicID, &e.ActorUserID, &e.Action, &e.TargetType, &e.TargetID, &e.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func (s *Store) UsageByOwner(ctx context.Context, ownerUserID string, filter domain.UsageFilter) ([]domain.UsageRecord, error) {
	rows, err := s.DB.Query(ctx, `SELECT ur.public_id, j.public_id, p.public_id, m.public_id, m.slug, pr.public_id, pi.public_id, ur.input_tokens, ur.output_tokens, ur.total_tokens, ur.token_source, ur.cost_credits, ur.latency_ms, ur.status, ur.created_at FROM usage_records ur JOIN inference_jobs j ON j.id=ur.job_id JOIN projects p ON p.id=ur.project_id JOIN models m ON m.id=ur.model_id LEFT JOIN providers pr ON pr.id=ur.provider_id LEFT JOIN provider_instances pi ON pi.id=ur.provider_instance_id WHERE p.owner_user_id=$1 AND ($2='' OR p.public_id=$2) AND ($3::timestamptz IS NULL OR ur.created_at >= $3) AND ($4::timestamptz IS NULL OR ur.created_at <= $4) AND ($5='' OR m.slug=$5) ORDER BY ur.created_at DESC LIMIT 100`, ownerUserID, filter.ProjectPublicID, filter.From, filter.To, filter.ModelSlug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.UsageRecord{}
	for rows.Next() {
		var r domain.UsageRecord
		if err := rows.Scan(&r.PublicID, &r.JobID, &r.ProjectID, &r.ModelID, &r.ModelSlug, &r.ProviderID, &r.ProviderInstanceID, &r.InputTokens, &r.OutputTokens, &r.TotalTokens, &r.TokenSource, &r.CostCredits, &r.LatencyMS, &r.Status, &r.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Store) MarkStaleProviderInstancesOffline(ctx context.Context, cutoff time.Time) (int64, error) {
	cmd, err := s.DB.Exec(ctx, `UPDATE provider_instances SET status='offline', updated_at=now() WHERE status IN ('online','busy','draining') AND last_heartbeat_at < $1`, cutoff)
	if err != nil {
		return 0, err
	}
	return cmd.RowsAffected(), nil
}

func authPublicID(prefix string) string { return auth.PublicID(prefix) }
