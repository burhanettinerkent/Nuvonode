package handler

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nuvonode/nuvonode/apps/api/internal/config"
	"github.com/nuvonode/nuvonode/apps/api/internal/domain"
	"github.com/nuvonode/nuvonode/apps/api/internal/httpx"
	"github.com/nuvonode/nuvonode/apps/api/internal/metering"
	"github.com/nuvonode/nuvonode/apps/api/internal/repository"
	"github.com/nuvonode/nuvonode/apps/api/internal/service"
	wsp "github.com/nuvonode/nuvonode/apps/api/internal/ws"
	"github.com/redis/go-redis/v9"
)

type Handler struct {
	cfg   config.Config
	db    *pgxpool.Pool
	redis *redis.Client
	svc   *service.Services
	hub   *wsp.Hub
}

func New(cfg config.Config, db *pgxpool.Pool, redis *redis.Client, svc *service.Services, hub *wsp.Hub) *Handler {
	return &Handler{cfg: cfg, db: db, redis: redis, svc: svc, hub: hub}
}

func (h *Handler) Health(c *fiber.Ctx) error {
	dbStatus, redisStatus := "ok", "ok"
	if err := h.db.Ping(c.Context()); err != nil {
		dbStatus = "error"
	}
	if err := h.redis.Ping(c.Context()).Err(); err != nil {
		redisStatus = "error"
	}
	status := fiber.StatusOK
	if dbStatus != "ok" || redisStatus != "ok" {
		status = fiber.StatusServiceUnavailable
	}
	return c.Status(status).JSON(fiber.Map{"status": "ok", "db": dbStatus, "redis": redisStatus, "version": "dev"})
}

func (h *Handler) Register(c *fiber.Ctx) error {
	var req registerRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
	}
	res, err := h.svc.Auth.Register(c.Context(), service.RegisterInput{Email: req.Email, Password: req.Password, DisplayName: req.DisplayName})
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(authResponse(res))
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var req loginRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
	}
	res, err := h.svc.Auth.Login(c.Context(), req.Email, req.Password)
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(authResponse(res))
}

func (h *Handler) Me(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"user": userResponse(httpx.User(c))})
}

func (h *Handler) ListProjects(c *fiber.Ctx) error {
	projects, err := h.svc.Projects.List(c.Context(), httpx.User(c))
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"projects": projects})
}

func (h *Handler) CreateProject(c *fiber.Ctx) error {
	var req projectRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
	}
	p, err := h.svc.Projects.Create(c.Context(), httpx.User(c), req.Name, req.MonthlyCreditLimit)
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"project": p})
}

func (h *Handler) ListAPIKeys(c *fiber.Ctx) error {
	keys, err := h.svc.Projects.APIKeys(c.Context(), httpx.User(c), c.Params("project_id"))
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"api_keys": keys})
}

func (h *Handler) CreateAPIKey(c *fiber.Ctx) error {
	var req nameRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
	}
	key, plaintext, err := h.svc.Projects.CreateAPIKey(c.Context(), httpx.User(c), c.Params("project_id"), req.Name, h.cfg.APIKeyPepper)
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"api_key": key, "plaintext_key": plaintext})
}

func (h *Handler) RevokeAPIKey(c *fiber.Ctx) error {
	if err := h.svc.Projects.RevokeAPIKey(c.Context(), httpx.User(c), c.Params("project_id"), c.Params("key_id")); err != nil {
		return httpx.Handle(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) Wallet(c *fiber.Ctx) error {
	w, err := h.svc.Wallets.UserWallet(c.Context(), httpx.User(c).PublicID)
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"balance_credits": w.BalanceCredits, "reserved_credits": w.ReservedCredits, "disclaimer": "Credits are internal platform credits and cannot be withdrawn or converted to cash in V1."})
}

func (h *Handler) Ledger(c *fiber.Ctx) error {
	w, err := h.svc.Wallets.UserWallet(c.Context(), httpx.User(c).PublicID)
	if err != nil {
		return httpx.Handle(c, err)
	}
	entries, err := h.svc.Wallets.Ledger(c.Context(), w.ID)
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"ledger": entries})
}

func (h *Handler) Usage(c *fiber.Ctx) error {
	filter, err := usageFilter(c)
	if err != nil {
		return httpx.Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
	}
	usage, err := h.svc.Usage.List(c.Context(), httpx.User(c), filter)
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"usage": usage})
}

func (h *Handler) Models(c *fiber.Ctx) error {
	models, err := h.svc.Models.Active(c.Context())
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"models": models})
}

func (h *Handler) OpenAIModels(c *fiber.Ctx) error {
	if _, err := h.svc.OpenAI.ResolveAPIKey(c.Context(), httpx.Bearer(c)); err != nil {
		return httpx.Handle(c, err)
	}
	models, err := h.svc.Models.Active(c.Context())
	if err != nil {
		return httpx.Handle(c, err)
	}
	data := make([]fiber.Map, 0, len(models))
	for _, m := range models {
		data = append(data, fiber.Map{"id": m.Slug, "object": "model", "created": m.CreatedAt.Unix(), "owned_by": "nuvonode-community"})
	}
	return c.JSON(fiber.Map{"object": "list", "data": data})
}

func (h *Handler) Providers(c *fiber.Ctx) error {
	providers, err := h.svc.Provider.List(c.Context(), httpx.User(c))
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"providers": providers})
}

func (h *Handler) CreateProvider(c *fiber.Ctx) error {
	var req providerRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
	}
	res, err := h.svc.Provider.Create(c.Context(), httpx.User(c), service.ProviderInput{Name: req.Name, RegionHint: req.RegionHint, AllowAutoModelPull: req.AllowAutoModelPull})
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"provider": res.Provider, "plaintext_token": res.PlaintextToken})
}

func (h *Handler) AdminModels(c *fiber.Ctx) error {
	models, err := h.svc.Admin.Models(c.Context(), httpx.User(c))
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"models": models})
}

func (h *Handler) CreateAdminModel(c *fiber.Ctx) error {
	var req adminModelRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
	}
	model, err := h.svc.Admin.CreateModel(c.Context(), httpx.User(c), req.modelInput())
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"model": model})
}

func (h *Handler) UpdateAdminModel(c *fiber.Ctx) error {
	var req adminModelRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
	}
	model, err := h.svc.Admin.UpdateModel(c.Context(), httpx.User(c), c.Params("model_id"), req.modelPatch())
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"model": model})
}

func (h *Handler) PauseAdminModel(c *fiber.Ctx) error {
	if err := h.svc.Admin.PauseModel(c.Context(), httpx.User(c), c.Params("model_id")); err != nil {
		return httpx.Handle(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) AdminJobs(c *fiber.Ctx) error {
	jobs, err := h.svc.Admin.Jobs(c.Context(), httpx.User(c))
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"jobs": jobs})
}

func (h *Handler) AdminAuditLog(c *fiber.Ctx) error {
	entries, err := h.svc.Admin.AuditLog(c.Context(), httpx.User(c))
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"audit_log": entries})
}

func (h *Handler) AdminUsage(c *fiber.Ctx) error {
	usage, err := h.svc.Admin.Usage(c.Context(), httpx.User(c))
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"usage": usage})
}

func (h *Handler) AdjustWallet(c *fiber.Ctx) error {
	var req walletAdjustRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
	}
	wallet, err := h.svc.Admin.AdjustWallet(c.Context(), httpx.User(c), c.Params("user_id"), req.AmountCredits, req.Reason)
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"wallet": fiber.Map{"id": wallet.PublicID, "owner_type": wallet.OwnerType, "balance_credits": wallet.BalanceCredits, "reserved_credits": wallet.ReservedCredits}})
}

func (h *Handler) AdminProviders(c *fiber.Ctx) error {
	providers, err := h.svc.Admin.Providers(c.Context(), httpx.User(c))
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"providers": providers})
}

func (h *Handler) ApproveProvider(c *fiber.Ctx) error {
	if err := h.svc.Admin.SetProviderApproval(c.Context(), httpx.User(c), c.Params("provider_id"), "approved"); err != nil {
		return httpx.Handle(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) RejectProvider(c *fiber.Ctx) error {
	if err := h.svc.Admin.SetProviderApproval(c.Context(), httpx.User(c), c.Params("provider_id"), "rejected"); err != nil {
		return httpx.Handle(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) DisableProvider(c *fiber.Ctx) error {
	providerID := c.Params("provider_id")
	if err := h.svc.Admin.DisableProvider(c.Context(), httpx.User(c), providerID); err != nil {
		return httpx.Handle(c, err)
	}
	_ = h.hub.Disconnect(providerID)
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) PendingProviderModels(c *fiber.Ctx) error {
	ads, err := h.svc.Admin.PendingProviderModelAdvertisements(c.Context(), httpx.User(c))
	if err != nil {
		return httpx.Handle(c, err)
	}
	return c.JSON(fiber.Map{"provider_model_advertisements": ads})
}

func (h *Handler) ApproveProviderModel(c *fiber.Ctx) error {
	if err := h.svc.Admin.SetProviderModelAdvertisementStatus(c.Context(), httpx.User(c), c.Params("id"), "approved"); err != nil {
		return httpx.Handle(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) RejectProviderModel(c *fiber.Ctx) error {
	if err := h.svc.Admin.SetProviderModelAdvertisementStatus(c.Context(), httpx.User(c), c.Params("id"), "rejected"); err != nil {
		return httpx.Handle(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) ChatCompletions(c *fiber.Ctx) error {
	authCtx, err := h.svc.OpenAI.ResolveAPIKey(c.Context(), httpx.Bearer(c))
	if err != nil {
		return httpx.Handle(c, err)
	}
	var req chatRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
	}
	if req.Stream {
		return httpx.Error(c, fiber.StatusBadRequest, "streaming_not_implemented", "Streaming chat completions are planned for V1.1. Send stream=false for V1.")
	}
	if strings.TrimSpace(req.Model) == "" || len(req.Messages) == 0 {
		return httpx.Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
	}
	for _, m := range req.Messages {
		if m.Content == "" || (m.Role != "system" && m.Role != "user" && m.Role != "assistant") {
			return httpx.Error(c, fiber.StatusBadRequest, "invalid_request", "Invalid request body.")
		}
	}
	model, err := h.svc.OpenAI.Model(c.Context(), req.Model)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return httpx.Error(c, fiber.StatusNotFound, "model_not_found", "Requested model was not found.")
		}
		return httpx.Handle(c, err)
	}
	if model.ExternalOnly && !h.cfg.ExternalConnectorsEnabled {
		return httpx.Error(c, fiber.StatusBadRequest, "external_connectors_disabled", "This model requires an external connector, but external connectors are disabled on this deployment.")
	}
	route, err := h.svc.OpenAI.FindProvider(c.Context(), model.ID)
	if err != nil {
		return httpx.Error(c, fiber.StatusServiceUnavailable, "model_unavailable", "No approved online provider is currently available for this model.")
	}
	jobPublicID := "job_" + time.Now().UTC().Format("20060102150405.000000000")
	messages := make([]wsp.ChatMessage, 0, len(req.Messages))
	for _, msg := range req.Messages {
		messages = append(messages, wsp.ChatMessage{Role: msg.Role, Content: msg.Content})
	}
	maxTokens := req.MaxTokens
	if maxTokens <= 0 {
		maxTokens = model.DefaultMaxOutputTokens
	}
	inputChars := 0
	for _, msg := range req.Messages {
		inputChars += len(msg.Content)
	}
	inputTokens := metering.EstimateTokensFromChars(inputChars)
	reservedCredits := service.PriceCredits(inputTokens, maxTokens, model.InputCreditPer1K, model.OutputCreditPer1K)
	jobDBID, err := h.svc.OpenAI.CreateJob(c.Context(), jobPublicID, authCtx, model, route, httpx.RequestID(c), inputTokens, maxTokens, reservedCredits)
	if err != nil {
		return httpx.Handle(c, err)
	}
	userWalletID, err := h.svc.Wallets.ReserveForUser(c.Context(), authCtx.User.ID, reservedCredits, "chat_completion_reservation")
	if err != nil {
		_ = h.svc.OpenAI.MarkJobFailed(c.Context(), jobDBID, "failed", "insufficient_credits", err.Error())
		return httpx.Handle(c, err)
	}
	_ = h.svc.OpenAI.MarkJobDispatched(c.Context(), jobDBID)
	result, err := h.hub.Dispatch(route.ProviderPublicID, wsp.JobRequestPayload{JobID: jobPublicID, ModelSlug: model.Slug, Runtime: "ollama", RuntimeModelName: route.RuntimeModelName, Messages: messages, Parameters: map[string]any{"temperature": req.Temperature, "max_tokens": maxTokens}, TimeoutSeconds: int(h.cfg.JobTimeout.Seconds())}, h.cfg.JobTimeout)
	if err != nil {
		_ = h.svc.Wallets.Release(c.Context(), userWalletID, reservedCredits, "provider_unavailable_release")
		_ = h.svc.OpenAI.MarkJobFailed(c.Context(), jobDBID, "failed", "provider_unavailable", err.Error())
		return httpx.Error(c, fiber.StatusServiceUnavailable, "provider_unavailable", "No connected provider is currently available for this model.")
	}
	if result.ErrorCode != "" {
		_ = h.svc.Wallets.Release(c.Context(), userWalletID, reservedCredits, "provider_failed_release")
		_ = h.svc.OpenAI.MarkJobFailed(c.Context(), jobDBID, "failed", result.ErrorCode, result.ErrorMessage)
		return httpx.Error(c, fiber.StatusBadGateway, "provider_failed", result.ErrorMessage)
	}
	completionChars := len(result.Content)
	promptTokens, completionTokens, tokenSource := metering.ValidateReportedTokens(inputChars, completionChars, 0, 0)
	if result.Usage != nil {
		promptTokens, completionTokens, tokenSource = metering.ValidateReportedTokens(inputChars, completionChars, result.Usage.PromptTokens, result.Usage.CompletionTokens)
	}
	actualCost := service.PriceCredits(promptTokens, completionTokens, model.InputCreditPer1K, model.OutputCreditPer1K)
	if actualCost > reservedCredits {
		actualCost = reservedCredits
	}
	providerReward := service.ProviderReward(actualCost, model.ProviderRewardRatio)
	if err := h.svc.Wallets.FinalizeUsage(c.Context(), service.UsageSettlement{UserWalletID: userWalletID, ProviderPublicID: route.ProviderPublicID, ReservedCredits: reservedCredits, ActualCostCredits: actualCost, ProviderRewardCredits: providerReward, JobID: jobDBID, ProjectID: authCtx.Project.ID, UserID: authCtx.User.ID, ModelID: model.ID, ProviderID: route.ProviderID, ProviderInstanceID: route.ProviderInstanceID, InputTokens: promptTokens, OutputTokens: completionTokens, TokenSource: tokenSource, LatencyMS: result.LatencyMS}); err != nil {
		_ = h.svc.Wallets.Release(c.Context(), userWalletID, reservedCredits, "settlement_failed_release")
		return httpx.Handle(c, err)
	}
	usage := fiber.Map{"prompt_tokens": promptTokens, "completion_tokens": completionTokens, "total_tokens": promptTokens + completionTokens}
	c.Set("x-nuvonode-job-id", jobPublicID)
	c.Set("x-nuvonode-provider-id", route.ProviderPublicID)
	return c.JSON(fiber.Map{"id": "chatcmpl_" + jobPublicID, "object": "chat.completion", "created": time.Now().UTC().Unix(), "model": model.Slug, "choices": []fiber.Map{{"index": 0, "message": fiber.Map{"role": "assistant", "content": result.Content}, "finish_reason": result.FinishReason}}, "usage": usage})
}

type registerRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
}
type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
type projectRequest struct {
	Name               string `json:"name"`
	MonthlyCreditLimit *int64 `json:"monthly_credit_limit"`
}
type nameRequest struct {
	Name string `json:"name"`
}
type providerRequest struct {
	Name               string  `json:"name"`
	RegionHint         *string `json:"region_hint"`
	AllowAutoModelPull bool    `json:"allow_auto_model_pull"`
}
type walletAdjustRequest struct {
	AmountCredits int64  `json:"amount_credits"`
	Reason        string `json:"reason"`
}
type adminModelRequest struct {
	Slug                   *string  `json:"slug"`
	DisplayName            *string  `json:"display_name"`
	Description            *string  `json:"description"`
	Family                 *string  `json:"family"`
	Modality               *string  `json:"modality"`
	Status                 *string  `json:"status"`
	ContextLength          *int     `json:"context_length"`
	DefaultMaxOutputTokens *int     `json:"default_max_output_tokens"`
	InputCreditPer1K       *int64   `json:"input_credit_per_1k"`
	OutputCreditPer1K      *int64   `json:"output_credit_per_1k"`
	ProviderRewardRatio    *float64 `json:"provider_reward_ratio"`
	MinVRAMMB              *int     `json:"min_vram_mb"`
	RecommendedVRAMMB      *int     `json:"recommended_vram_mb"`
	LicenseName            *string  `json:"license_name"`
	LicenseURL             *string  `json:"license_url"`
	LicenseNotes           *string  `json:"license_notes"`
	CommunityAllowed       *bool    `json:"community_allowed"`
	ExternalOnly           *bool    `json:"external_only"`
}
type chatRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	MaxTokens   int           `json:"max_tokens"`
	Temperature *float64      `json:"temperature"`
	Stream      bool          `json:"stream"`
}
type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func usageFilter(c *fiber.Ctx) (domain.UsageFilter, error) {
	parse := func(v string) (*time.Time, error) {
		if strings.TrimSpace(v) == "" {
			return nil, nil
		}
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			return nil, err
		}
		return &t, nil
	}
	from, err := parse(c.Query("from"))
	if err != nil {
		return domain.UsageFilter{}, err
	}
	to, err := parse(c.Query("to"))
	if err != nil {
		return domain.UsageFilter{}, err
	}
	return domain.UsageFilter{ProjectPublicID: c.Query("project_id"), From: from, To: to, ModelSlug: c.Query("model")}, nil
}

func (r adminModelRequest) modelInput() domain.ModelInput {
	in := domain.ModelInput{}
	if r.Slug != nil {
		in.Slug = *r.Slug
	}
	if r.DisplayName != nil {
		in.DisplayName = *r.DisplayName
	}
	if r.Description != nil {
		in.Description = *r.Description
	}
	if r.Family != nil {
		in.Family = *r.Family
	}
	if r.Modality != nil {
		in.Modality = *r.Modality
	}
	if r.Status != nil {
		in.Status = *r.Status
	}
	if r.ContextLength != nil {
		in.ContextLength = *r.ContextLength
	}
	if r.DefaultMaxOutputTokens != nil {
		in.DefaultMaxOutputTokens = *r.DefaultMaxOutputTokens
	}
	if r.InputCreditPer1K != nil {
		in.InputCreditPer1K = *r.InputCreditPer1K
	}
	if r.OutputCreditPer1K != nil {
		in.OutputCreditPer1K = *r.OutputCreditPer1K
	}
	if r.ProviderRewardRatio != nil {
		in.ProviderRewardRatio = *r.ProviderRewardRatio
	}
	if r.MinVRAMMB != nil {
		in.MinVRAMMB = *r.MinVRAMMB
	}
	if r.RecommendedVRAMMB != nil {
		in.RecommendedVRAMMB = *r.RecommendedVRAMMB
	}
	if r.LicenseName != nil {
		in.LicenseName = *r.LicenseName
	}
	in.LicenseURL = r.LicenseURL
	if r.LicenseNotes != nil {
		in.LicenseNotes = *r.LicenseNotes
	}
	in.CommunityAllowed = true
	if r.CommunityAllowed != nil {
		in.CommunityAllowed = *r.CommunityAllowed
	}
	if r.ExternalOnly != nil {
		in.ExternalOnly = *r.ExternalOnly
	}
	return in
}

func (r adminModelRequest) modelPatch() domain.ModelPatch {
	return domain.ModelPatch{Slug: r.Slug, DisplayName: r.DisplayName, Description: r.Description, Family: r.Family, Modality: r.Modality, Status: r.Status, ContextLength: r.ContextLength, DefaultMaxOutputTokens: r.DefaultMaxOutputTokens, InputCreditPer1K: r.InputCreditPer1K, OutputCreditPer1K: r.OutputCreditPer1K, ProviderRewardRatio: r.ProviderRewardRatio, MinVRAMMB: r.MinVRAMMB, RecommendedVRAMMB: r.RecommendedVRAMMB, LicenseName: r.LicenseName, LicenseURL: r.LicenseURL, LicenseNotes: r.LicenseNotes, CommunityAllowed: r.CommunityAllowed, ExternalOnly: r.ExternalOnly}
}

func (h *Handler) ProviderWS(c *websocket.Conn) {
	ctx := context.Background()
	provider, err := h.svc.Provider.ResolveToken(ctx, bearerFromHeader(c.Headers("Authorization")))
	if err != nil {
		_ = c.WriteJSON(fiber.Map{"error": "unauthorized"})
		_ = c.Close()
		return
	}
	h.hub.Register(provider.PublicID, c)
	defer h.hub.Unregister(provider.PublicID)
	var instance domain.ProviderInstance
	for {
		_, data, err := c.ReadMessage()
		if err != nil {
			return
		}
		var env wsp.Envelope
		if err := json.Unmarshal(data, &env); err != nil {
			_ = c.WriteJSON(fiber.Map{"error": "invalid_message"})
			continue
		}
		switch env.Type {
		case "provider.hello":
			var payload wsp.HelloPayload
			if json.Unmarshal(env.Payload, &payload) != nil || payload.InstanceKey == "" {
				_ = c.WriteJSON(fiber.Map{"error": "invalid_hello"})
				continue
			}
			instance, err = h.svc.Provider.UpsertInstance(ctx, provider, payload.InstanceKey, payload.Hostname, payload.OS, payload.Arch, payload.AppVersion)
			if err != nil {
				_ = c.WriteJSON(fiber.Map{"error": "hello_failed"})
				continue
			}
			ack := fiber.Map{"type": "server.hello_ack", "sent_at": time.Now().UTC(), "payload": fiber.Map{"provider_id": provider.PublicID, "instance_id": instance.PublicID, "approval_status": provider.ApprovalStatus, "server_time": time.Now().UTC()}}
			_ = c.WriteJSON(ack)
		case "provider.heartbeat":
			if instance.ID == "" {
				_ = c.WriteJSON(fiber.Map{"error": "hello_required"})
				continue
			}
			var payload wsp.HeartbeatPayload
			if json.Unmarshal(env.Payload, &payload) != nil {
				_ = c.WriteJSON(fiber.Map{"error": "invalid_heartbeat"})
				continue
			}
			if err := h.svc.Provider.Heartbeat(ctx, instance, payload.Status, payload.CurrentJobID); err != nil {
				_ = c.WriteJSON(fiber.Map{"error": "heartbeat_failed"})
			}
		case "provider.hardware_report":
			if instance.ID == "" {
				_ = c.WriteJSON(fiber.Map{"error": "hello_required"})
				continue
			}
			var payload wsp.HardwareReportPayload
			if json.Unmarshal(env.Payload, &payload) != nil {
				_ = c.WriteJSON(fiber.Map{"error": "invalid_hardware_report"})
				continue
			}
			gpuName, gpuDriver := "", ""
			gpuVRAM := 0
			if len(payload.GPUs) > 0 {
				gpuName = payload.GPUs[0].Name
				gpuDriver = payload.GPUs[0].Driver
				gpuVRAM = payload.GPUs[0].VRAMMB
			}
			if err := h.svc.Provider.HardwareReport(ctx, instance, payload.CPUModel, payload.RAMMB, gpuName, gpuVRAM, gpuDriver, payload.Raw); err != nil {
				_ = c.WriteJSON(fiber.Map{"error": "hardware_report_failed"})
			}
		case "provider.model_list":
			if instance.ID == "" {
				_ = c.WriteJSON(fiber.Map{"error": "hello_required"})
				continue
			}
			var payload wsp.ModelListPayload
			if json.Unmarshal(env.Payload, &payload) != nil {
				_ = c.WriteJSON(fiber.Map{"error": "invalid_model_list"})
				continue
			}
			models := map[string]string{}
			for _, m := range payload.Models {
				models[m.RuntimeModelName] = m.Digest
			}
			if err := h.svc.Provider.ModelList(ctx, provider, instance, payload.Runtime, models); err != nil {
				_ = c.WriteJSON(fiber.Map{"error": "model_list_failed"})
			}
		case "provider.job_result":
			var payload wsp.JobResultPayload
			if json.Unmarshal(env.Payload, &payload) == nil {
				h.hub.Complete(payload)
			}
		case "provider.job_error":
			var payload wsp.JobErrorPayload
			if json.Unmarshal(env.Payload, &payload) == nil {
				h.hub.Complete(wsp.JobResultPayload{JobID: payload.JobID, ErrorCode: payload.ErrorCode, ErrorMessage: payload.ErrorMessage})
			}
		}
	}
}

func bearerFromHeader(h string) string {
	if !strings.HasPrefix(h, "Bearer ") {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(h, "Bearer "))
}

func authResponse(res service.AuthResult) fiber.Map {
	return fiber.Map{"user": userResponse(res.User), "access_token": res.AccessToken}
}
func userResponse(u domain.User) fiber.Map {
	return fiber.Map{"id": u.PublicID, "email": u.Email, "display_name": u.DisplayName, "role": u.Role}
}
