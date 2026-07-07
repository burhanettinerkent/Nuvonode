import { getToken, type User } from "./session";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:18080";

type APIErrorBody = {
  error?: {
    code?: string;
    message?: string;
    request_id?: string;
  };
};

export class APIError extends Error {
  code: string;
  requestID: string;
  status: number;

  constructor(message: string, code: string, requestID: string, status: number) {
    super(message);
    this.code = code;
    this.requestID = requestID;
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${baseURL}${path}`, { ...init, headers });
  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const body = text ? (JSON.parse(text) as APIErrorBody & T) : ({} as APIErrorBody & T);

  if (!res.ok) {
    const detail = body.error || {};
    throw new APIError(detail.message || "Request failed.", detail.code || "request_failed", detail.request_id || "req_unknown", res.status);
  }

  return body as T;
}

function arrayOrEmpty<T>(items: T[] | null | undefined): T[] {
  return items ?? [];
}

export type AuthResponse = {
  user: User;
  access_token: string;
};

export type Project = {
  id: string;
  name: string;
  status: string;
  monthly_credit_limit: number | null;
  current_month_spend: number;
  spend_period: string;
  created_at: string;
};

export type Wallet = {
  balance_credits: number;
  reserved_credits: number;
  disclaimer?: string;
};

export type Provider = {
  id: string;
  name: string;
  region_hint: string | null;
  trust_level: string;
  approval_status: string;
  status: string;
  allow_auto_model_pull: boolean;
  token_prefix?: string;
  created_at: string;
};

export type Model = {
  id: string;
  slug: string;
  display_name: string;
  description: string;
  family: string;
  modality: string;
  status: string;
  context_length: number;
  default_max_output_tokens: number;
  input_credit_per_1k: number;
  output_credit_per_1k: number;
  provider_reward_ratio: number;
  min_vram_mb: number;
  recommended_vram_mb: number;
  license_name: string;
  license_url: string | null;
  license_notes: string;
  community_allowed: boolean;
  external_only: boolean;
  created_at: string;
};

export type UsageRecord = {
  id: string;
  job_id: string;
  project_id: string;
  model_id: string;
  model_slug: string;
  provider_id: string | null;
  provider_instance_id: string | null;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  token_source: string;
  cost_credits: number;
  latency_ms: number | null;
  status: string;
  created_at: string;
};

export type APIKey = {
  id: string;
  name: string;
  prefix: string;
  status: string;
  created_at: string;
};

export type LedgerEntry = {
  id: string;
  entry_type: string;
  amount_credits: number;
  reserved_delta: number;
  balance_after: number;
  reserved_after: number;
  reason: string | null;
  created_at: string;
};

export type ProviderCreateResponse = {
  provider: Provider;
  plaintext_token: string;
};

export type APIKeyCreateResponse = {
  api_key: APIKey;
  plaintext_key: string;
};

export type UsageFilter = {
  projectID?: string;
  from?: string;
  to?: string;
  model?: string;
};

export type ProviderModelAdvertisement = {
  id: string;
  provider_id: string;
  runtime: string;
  runtime_model_name: string;
  local_digest: string | null;
  status: string;
  created_at: string;
};

export type AdminJob = {
  id: string;
  project_id: string;
  user_id: string;
  model_id: string;
  model_slug: string;
  provider_id: string | null;
  provider_instance_id: string | null;
  status: string;
  request_id: string;
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  reserved_credits: number;
  actual_cost_credits: number;
  provider_reward_credits: number;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  dispatched_at: string | null;
  completed_at: string | null;
};

export type AdminUsageRecord = UsageRecord & {
  user_id: string;
  provider_reward_credits: number;
};

export type ModelPayload = Partial<Omit<Model, "id" | "created_at">>;

export type AdminWalletAdjustResponse = {
  wallet: {
    id: string;
    owner_type: string;
    balance_credits: number;
    reserved_credits: number;
  };
};

export function me() {
  return apiFetch<{ user: User }>("/api/me");
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function register(displayName: string, email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify({ display_name: displayName, email, password }) });
}

export function getWallet() {
  return apiFetch<Wallet>("/api/wallet");
}

export function listProjects() {
  return apiFetch<{ projects: Project[] | null }>("/api/projects").then((res) => ({ projects: arrayOrEmpty(res.projects) }));
}

export function createProject(name: string, monthlyCreditLimit: number | null) {
  return apiFetch<{ project: Project }>("/api/projects", { method: "POST", body: JSON.stringify({ name, monthly_credit_limit: monthlyCreditLimit }) });
}

export function listAPIKeys(projectID: string) {
  return apiFetch<{ api_keys: APIKey[] | null }>(`/api/projects/${projectID}/api-keys`).then((res) => ({ api_keys: arrayOrEmpty(res.api_keys) }));
}

export function createAPIKey(projectID: string, name: string) {
  return apiFetch<APIKeyCreateResponse>(`/api/projects/${projectID}/api-keys`, { method: "POST", body: JSON.stringify({ name }) });
}

export function revokeAPIKey(projectID: string, keyID: string) {
  return apiFetch<void>(`/api/projects/${projectID}/api-keys/${keyID}`, { method: "DELETE" });
}

export function listProviders() {
  return apiFetch<{ providers: Provider[] | null }>("/api/providers").then((res) => ({ providers: arrayOrEmpty(res.providers) }));
}

export function createProvider(name: string, regionHint: string | null, allowAutoModelPull: boolean) {
  return apiFetch<ProviderCreateResponse>("/api/providers", { method: "POST", body: JSON.stringify({ name, region_hint: regionHint, allow_auto_model_pull: allowAutoModelPull }) });
}

export function listModels() {
  return apiFetch<{ models: Model[] | null }>("/api/models").then((res) => ({ models: arrayOrEmpty(res.models) }));
}

export function listLedger() {
  return apiFetch<{ ledger: LedgerEntry[] | null }>("/api/wallet/ledger").then((res) => ({ ledger: arrayOrEmpty(res.ledger) }));
}

export function listUsage(filter: UsageFilter = {}) {
  const params = new URLSearchParams();
  if (filter.projectID) params.set("project_id", filter.projectID);
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  if (filter.model) params.set("model", filter.model);
  const query = params.toString();
  return apiFetch<{ usage: UsageRecord[] | null }>(`/api/usage${query ? `?${query}` : ""}`).then((res) => ({ usage: arrayOrEmpty(res.usage) }));
}

export function listAdminProviders() {
  return apiFetch<{ providers: Provider[] | null }>("/api/admin/providers").then((res) => ({ providers: arrayOrEmpty(res.providers) }));
}

export function approveProvider(providerID: string) {
  return apiFetch<void>(`/api/admin/providers/${providerID}/approve`, { method: "POST" });
}

export function rejectProvider(providerID: string) {
  return apiFetch<void>(`/api/admin/providers/${providerID}/reject`, { method: "POST" });
}

export function disableProvider(providerID: string) {
  return apiFetch<void>(`/api/admin/providers/${providerID}/disable`, { method: "POST" });
}

export function listPendingProviderModels() {
  return apiFetch<{ provider_model_advertisements: ProviderModelAdvertisement[] | null }>("/api/admin/provider-models/pending").then((res) => ({ provider_model_advertisements: arrayOrEmpty(res.provider_model_advertisements) }));
}

export function approveProviderModel(id: string) {
  return apiFetch<void>(`/api/admin/provider-models/${id}/approve`, { method: "POST" });
}

export function rejectProviderModel(id: string) {
  return apiFetch<void>(`/api/admin/provider-models/${id}/reject`, { method: "POST" });
}

export function listAdminModels() {
  return apiFetch<{ models: Model[] | null }>("/api/admin/models").then((res) => ({ models: arrayOrEmpty(res.models) }));
}

export function createAdminModel(model: ModelPayload) {
  return apiFetch<{ model: Model }>("/api/admin/models", { method: "POST", body: JSON.stringify(model) });
}

export function updateAdminModel(modelID: string, model: ModelPayload) {
  return apiFetch<{ model: Model }>(`/api/admin/models/${modelID}`, { method: "PATCH", body: JSON.stringify(model) });
}

export function pauseAdminModel(modelID: string) {
  return apiFetch<void>(`/api/admin/models/${modelID}/pause`, { method: "POST" });
}

export function listAdminJobs() {
  return apiFetch<{ jobs: AdminJob[] | null }>("/api/admin/jobs").then((res) => ({ jobs: arrayOrEmpty(res.jobs) }));
}

export function listAdminUsage() {
  return apiFetch<{ usage: AdminUsageRecord[] | null }>("/api/admin/usage").then((res) => ({ usage: arrayOrEmpty(res.usage) }));
}

export type AdminAuditLogEntry = {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

export function listAdminAuditLog() {
  return apiFetch<{ audit_log: AdminAuditLogEntry[] | null }>("/api/admin/audit-log").then((res) => ({ audit_log: arrayOrEmpty(res.audit_log) }));
}

export function adjustAdminWallet(userID: string, amountCredits: number, reason: string) {
  return apiFetch<AdminWalletAdjustResponse>(`/api/admin/wallets/${userID}/adjust`, { method: "POST", body: JSON.stringify({ amount_credits: amountCredits, reason }) });
}
