type DisplayValue = string | boolean | number | null | undefined;

export function formatLabel(value: DisplayValue) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function StatusPill({ value }: { value: string | null | undefined }) {
  const normalized = String(value ?? "").toLowerCase();
  const className = ["active", "approved", "completed", "success", "succeeded", "allowed", "community_allowed", "local_allowed"].includes(normalized)
    ? "pill ok"
    : ["pending", "paused", "queued", "running", "created", "medium", "reservation", "reserve", "release", "external_only"].includes(normalized)
      ? "pill warn"
      : ["rejected", "disabled", "failed", "revoked", "error", "debit", "not_allowed", "community_blocked"].includes(normalized)
        ? "pill danger"
        : "pill";

  return <span className={className}>{formatLabel(value)}</span>;
}
