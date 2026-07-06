-- Nuvonode Mesh V1 schema
-- PostgreSQL 16+

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
    monthly_credit_limit BIGINT,
    current_month_spend BIGINT NOT NULL DEFAULT 0,
    spend_period TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_owner ON projects(owner_user_id) WHERE deleted_at IS NULL;

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id),
    name TEXT NOT NULL,
    prefix TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_project ON api_keys(project_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    owner_type TEXT NOT NULL CHECK (owner_type IN ('user', 'project', 'provider')),
    owner_id UUID NOT NULL,
    balance_credits BIGINT NOT NULL DEFAULT 0,
    reserved_credits BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(owner_type, owner_id)
);

CREATE TABLE wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    entry_type TEXT NOT NULL CHECK (entry_type IN (
        'grant', 'reserve', 'release_reserve', 'debit_usage', 'credit_provider_reward', 'admin_adjustment', 'refund'
    )),
    amount_credits BIGINT NOT NULL,
    reserved_delta BIGINT NOT NULL DEFAULT 0,
    balance_after BIGINT NOT NULL,
    reserved_after BIGINT NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_ledger_wallet_created ON wallet_ledger(wallet_id, created_at DESC);
CREATE INDEX idx_wallet_ledger_reference ON wallet_ledger(reference_type, reference_id);

CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    family TEXT NOT NULL,
    modality TEXT NOT NULL DEFAULT 'text' CHECK (modality IN ('text', 'embedding', 'image', 'audio')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deprecated')),
    context_length INT NOT NULL DEFAULT 4096,
    default_max_output_tokens INT NOT NULL DEFAULT 1024,
    input_credit_per_1k BIGINT NOT NULL DEFAULT 10,
    output_credit_per_1k BIGINT NOT NULL DEFAULT 20,
    provider_reward_ratio NUMERIC(6,4) NOT NULL DEFAULT 0.7000,
    min_vram_mb INT NOT NULL DEFAULT 8192,
    recommended_vram_mb INT NOT NULL DEFAULT 12288,
    license_name TEXT NOT NULL DEFAULT 'unknown',
    license_url TEXT,
    license_notes TEXT NOT NULL DEFAULT '',
    community_allowed BOOLEAN NOT NULL DEFAULT true,
    external_only BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    model_id UUID NOT NULL REFERENCES models(id),
    version_label TEXT NOT NULL,
    runtime TEXT NOT NULL DEFAULT 'ollama' CHECK (runtime IN ('ollama', 'external_openai_compatible')),
    runtime_model_name TEXT NOT NULL,
    quantization TEXT,
    parameters_billion NUMERIC(8,2),
    checksum TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deprecated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(model_id, version_label)
);

CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES users(id),
    wallet_id UUID REFERENCES wallets(id),
    name TEXT NOT NULL,
    region_hint TEXT,
    trust_level TEXT NOT NULL DEFAULT 'community' CHECK (trust_level IN ('community', 'verified', 'managed')),
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    allow_auto_model_pull BOOLEAN NOT NULL DEFAULT false,
    token_prefix TEXT,
    token_hash TEXT UNIQUE,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_providers_owner ON providers(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_providers_status ON providers(approval_status, status);

CREATE TABLE provider_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    provider_id UUID NOT NULL REFERENCES providers(id),
    instance_key TEXT NOT NULL,
    hostname TEXT,
    os TEXT,
    arch TEXT,
    app_version TEXT,
    ollama_version TEXT,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'draining')),
    connected_at TIMESTAMPTZ,
    last_heartbeat_at TIMESTAMPTZ,
    current_job_id UUID,
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider_id, instance_key)
);

CREATE INDEX idx_provider_instances_provider ON provider_instances(provider_id);
CREATE INDEX idx_provider_instances_status ON provider_instances(status, last_heartbeat_at DESC);

CREATE TABLE provider_hardware_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_instance_id UUID NOT NULL REFERENCES provider_instances(id),
    cpu_model TEXT,
    ram_mb INT,
    gpu_name TEXT,
    gpu_vram_mb INT,
    gpu_driver TEXT,
    cuda_version TEXT,
    metal_supported BOOLEAN,
    rocm_supported BOOLEAN,
    raw JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE provider_model_advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    provider_id UUID NOT NULL REFERENCES providers(id),
    provider_instance_id UUID REFERENCES provider_instances(id),
    model_id UUID REFERENCES models(id),
    model_version_id UUID REFERENCES model_versions(id),
    runtime TEXT NOT NULL DEFAULT 'ollama',
    runtime_model_name TEXT NOT NULL,
    local_digest TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disabled')),
    benchmark_tokens_per_second NUMERIC(10,3),
    benchmark_latency_ms INT,
    last_seen_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_model_ads_provider ON provider_model_advertisements(provider_id, status);
CREATE INDEX idx_provider_model_ads_model ON provider_model_advertisements(model_id, status);

CREATE TABLE inference_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id UUID NOT NULL REFERENCES users(id),
    api_key_id UUID REFERENCES api_keys(id),
    model_id UUID NOT NULL REFERENCES models(id),
    model_version_id UUID REFERENCES model_versions(id),
    provider_id UUID REFERENCES providers(id),
    provider_instance_id UUID REFERENCES provider_instances(id),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'dispatched', 'running', 'succeeded', 'failed', 'timed_out', 'cancelled')),
    request_id TEXT NOT NULL,
    idempotency_key TEXT,
    estimated_input_tokens INT NOT NULL DEFAULT 0,
    estimated_output_tokens INT NOT NULL DEFAULT 0,
    reserved_credits BIGINT NOT NULL DEFAULT 0,
    actual_cost_credits BIGINT NOT NULL DEFAULT 0,
    provider_reward_credits BIGINT NOT NULL DEFAULT 0,
    error_code TEXT,
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    dispatched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_inference_jobs_project_created ON inference_jobs(project_id, created_at DESC);
CREATE INDEX idx_inference_jobs_provider_created ON inference_jobs(provider_id, created_at DESC);
CREATE INDEX idx_inference_jobs_status ON inference_jobs(status, created_at DESC);
CREATE UNIQUE INDEX idx_inference_jobs_idempotency ON inference_jobs(project_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    job_id UUID NOT NULL UNIQUE REFERENCES inference_jobs(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id UUID NOT NULL REFERENCES users(id),
    model_id UUID NOT NULL REFERENCES models(id),
    provider_id UUID REFERENCES providers(id),
    provider_instance_id UUID REFERENCES provider_instances(id),
    input_tokens INT NOT NULL,
    output_tokens INT NOT NULL,
    total_tokens INT NOT NULL,
    token_source TEXT NOT NULL DEFAULT 'server_estimated' CHECK (token_source IN ('runtime_reported', 'server_estimated')),
    cost_credits BIGINT NOT NULL,
    provider_reward_credits BIGINT NOT NULL,
    latency_ms INT,
    status TEXT NOT NULL DEFAULT 'settled' CHECK (status IN ('settled', 'corrected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_project_created ON usage_records(project_id, created_at DESC);
CREATE INDEX idx_usage_provider_created ON usage_records(provider_id, created_at DESC);
CREATE INDEX idx_usage_model_created ON usage_records(model_id, created_at DESC);

CREATE TABLE provider_stats (
    provider_id UUID PRIMARY KEY REFERENCES providers(id),
    total_jobs BIGINT NOT NULL DEFAULT 0,
    succeeded_jobs BIGINT NOT NULL DEFAULT 0,
    failed_jobs BIGINT NOT NULL DEFAULT 0,
    timeout_jobs BIGINT NOT NULL DEFAULT 0,
    avg_latency_ms NUMERIC(12,2),
    avg_tokens_per_second NUMERIC(12,3),
    success_rate NUMERIC(6,4) NOT NULL DEFAULT 0,
    trust_score NUMERIC(8,4) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE external_model_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'openai_compatible',
    base_url TEXT NOT NULL,
    api_key_secret_ref TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'disabled' CHECK (status IN ('enabled', 'disabled')),
    budget_limit_credits BIGINT,
    monthly_spend_credits BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT UNIQUE NOT NULL,
    actor_user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_actor ON audit_log(actor_user_id, created_at DESC);
