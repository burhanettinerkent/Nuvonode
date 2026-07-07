package domain

import "time"

type User struct {
	ID           string
	PublicID     string
	Email        string
	PasswordHash string
	DisplayName  string
	Role         string
	Status       string
	CreatedAt    time.Time
}

type Project struct {
	ID                 string    `json:"-"`
	PublicID           string    `json:"id"`
	OwnerUserID        string    `json:"-"`
	Name               string    `json:"name"`
	Status             string    `json:"status"`
	MonthlyCreditLimit *int64    `json:"monthly_credit_limit"`
	CurrentMonthSpend  int64     `json:"current_month_spend"`
	SpendPeriod        string    `json:"spend_period"`
	CreatedAt          time.Time `json:"created_at"`
}

type APIKey struct {
	ID        string    `json:"-"`
	PublicID  string    `json:"id"`
	ProjectID string    `json:"-"`
	Name      string    `json:"name"`
	Prefix    string    `json:"prefix"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type Wallet struct {
	ID              string
	PublicID        string
	OwnerType       string
	OwnerID         string
	BalanceCredits  int64
	ReservedCredits int64
}

type LedgerEntry struct {
	PublicID      string    `json:"id"`
	EntryType     string    `json:"entry_type"`
	AmountCredits int64     `json:"amount_credits"`
	ReservedDelta int64     `json:"reserved_delta"`
	BalanceAfter  int64     `json:"balance_after"`
	ReservedAfter int64     `json:"reserved_after"`
	Reason        *string   `json:"reason"`
	CreatedAt     time.Time `json:"created_at"`
}

type Model struct {
	ID                     string    `json:"-"`
	PublicID               string    `json:"id"`
	Slug                   string    `json:"slug"`
	DisplayName            string    `json:"display_name"`
	Description            string    `json:"description"`
	Family                 string    `json:"family"`
	Modality               string    `json:"modality"`
	Status                 string    `json:"status"`
	ContextLength          int       `json:"context_length"`
	DefaultMaxOutputTokens int       `json:"default_max_output_tokens"`
	InputCreditPer1K       int64     `json:"input_credit_per_1k"`
	OutputCreditPer1K      int64     `json:"output_credit_per_1k"`
	ProviderRewardRatio    float64   `json:"provider_reward_ratio"`
	MinVRAMMB              int       `json:"min_vram_mb"`
	RecommendedVRAMMB      int       `json:"recommended_vram_mb"`
	LicenseName            string    `json:"license_name"`
	LicenseURL             *string   `json:"license_url"`
	LicenseNotes           string    `json:"license_notes"`
	CommunityAllowed       bool      `json:"community_allowed"`
	ExternalOnly           bool      `json:"external_only"`
	CreatedAt              time.Time `json:"created_at"`
}

type ModelInput struct {
	Slug                   string
	DisplayName            string
	Description            string
	Family                 string
	Modality               string
	Status                 string
	ContextLength          int
	DefaultMaxOutputTokens int
	InputCreditPer1K       int64
	OutputCreditPer1K      int64
	ProviderRewardRatio    float64
	MinVRAMMB              int
	RecommendedVRAMMB      int
	LicenseName            string
	LicenseURL             *string
	LicenseNotes           string
	CommunityAllowed       bool
	ExternalOnly           bool
}

type ModelPatch struct {
	Slug                   *string
	DisplayName            *string
	Description            *string
	Family                 *string
	Modality               *string
	Status                 *string
	ContextLength          *int
	DefaultMaxOutputTokens *int
	InputCreditPer1K       *int64
	OutputCreditPer1K      *int64
	ProviderRewardRatio    *float64
	MinVRAMMB              *int
	RecommendedVRAMMB      *int
	LicenseName            *string
	LicenseURL             *string
	LicenseNotes           *string
	CommunityAllowed       *bool
	ExternalOnly           *bool
}

type Provider struct {
	ID                 string    `json:"-"`
	PublicID           string    `json:"id"`
	OwnerUserID        string    `json:"-"`
	Name               string    `json:"name"`
	RegionHint         *string   `json:"region_hint"`
	TrustLevel         string    `json:"trust_level"`
	ApprovalStatus     string    `json:"approval_status"`
	Status             string    `json:"status"`
	AllowAutoModelPull bool      `json:"allow_auto_model_pull"`
	TokenPrefix        *string   `json:"token_prefix,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
}

type ProviderWithInstance struct {
	ID                 string     `json:"-"`
	PublicID           string     `json:"id"`
	OwnerUserID        string     `json:"-"`
	Name               string     `json:"name"`
	RegionHint         *string    `json:"region_hint"`
	TrustLevel         string     `json:"trust_level"`
	ApprovalStatus     string     `json:"approval_status"`
	Status             string     `json:"status"`
	AllowAutoModelPull bool       `json:"allow_auto_model_pull"`
	TokenPrefix        *string    `json:"token_prefix,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	InstanceStatus     *string    `json:"instance_status"`
	InstanceHeartbeat  *time.Time `json:"last_heartbeat_at"`
	ModelNames         []string   `json:"model_names"`
}

type ProviderInstance struct {
	ID              string
	PublicID        string
	ProviderID      string
	InstanceKey     string
	Status          string
	LastHeartbeatAt *time.Time
	CreatedAt       time.Time
}

type ProviderModelAdvertisement struct {
	ID               string    `json:"-"`
	PublicID         string    `json:"id"`
	ProviderID       string    `json:"provider_id"`
	Runtime          string    `json:"runtime"`
	RuntimeModelName string    `json:"runtime_model_name"`
	LocalDigest      *string   `json:"local_digest"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
}

type AdminJob struct {
	PublicID              string     `json:"id"`
	ProjectID             string     `json:"project_id"`
	UserID                string     `json:"user_id"`
	ModelID               string     `json:"model_id"`
	ModelSlug             string     `json:"model_slug"`
	ProviderID            *string    `json:"provider_id"`
	ProviderInstanceID    *string    `json:"provider_instance_id"`
	Status                string     `json:"status"`
	RequestID             string     `json:"request_id"`
	EstimatedInputTokens  int        `json:"estimated_input_tokens"`
	EstimatedOutputTokens int        `json:"estimated_output_tokens"`
	ReservedCredits       int64      `json:"reserved_credits"`
	ActualCostCredits     int64      `json:"actual_cost_credits"`
	ProviderRewardCredits int64      `json:"provider_reward_credits"`
	ErrorCode             *string    `json:"error_code"`
	ErrorMessage          *string    `json:"error_message"`
	CreatedAt             time.Time  `json:"created_at"`
	DispatchedAt          *time.Time `json:"dispatched_at"`
	CompletedAt           *time.Time `json:"completed_at"`
}

type AdminUsageRecord struct {
	PublicID              string    `json:"id"`
	JobID                 string    `json:"job_id"`
	ProjectID             string    `json:"project_id"`
	UserID                string    `json:"user_id"`
	ModelID               string    `json:"model_id"`
	ModelSlug             string    `json:"model_slug"`
	ProviderID            *string   `json:"provider_id"`
	ProviderInstanceID    *string   `json:"provider_instance_id"`
	InputTokens           int       `json:"input_tokens"`
	OutputTokens          int       `json:"output_tokens"`
	TotalTokens           int       `json:"total_tokens"`
	TokenSource           string    `json:"token_source"`
	CostCredits           int64     `json:"cost_credits"`
	ProviderRewardCredits int64     `json:"provider_reward_credits"`
	LatencyMS             *int      `json:"latency_ms"`
	Status                string    `json:"status"`
	CreatedAt             time.Time `json:"created_at"`
}

type UsageRecord struct {
	PublicID           string    `json:"id"`
	JobID              string    `json:"job_id"`
	ProjectID          string    `json:"project_id"`
	ModelID            string    `json:"model_id"`
	ModelSlug          string    `json:"model_slug"`
	ProviderID         *string   `json:"provider_id"`
	ProviderInstanceID *string   `json:"provider_instance_id"`
	InputTokens        int       `json:"input_tokens"`
	OutputTokens       int       `json:"output_tokens"`
	TotalTokens        int       `json:"total_tokens"`
	TokenSource        string    `json:"token_source"`
	CostCredits        int64     `json:"cost_credits"`
	LatencyMS          *int      `json:"latency_ms"`
	Status             string    `json:"status"`
	CreatedAt          time.Time `json:"created_at"`
}

type AdminAuditLogEntry struct {
	PublicID    string     `json:"id"`
	ActorUserID string     `json:"actor_user_id"`
	Action      string     `json:"action"`
	TargetType  *string    `json:"target_type"`
	TargetID    *string    `json:"target_id"`
	Metadata    []byte     `json:"-"`
	CreatedAt   time.Time  `json:"created_at"`
}

type UsageFilter struct {
	ProjectPublicID string
	From            *time.Time
	To              *time.Time
	ModelSlug       string
}
