"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { listAdminUsage, type AdminUsageRecord } from "@/lib/api";

export default function AdminUsagePage() {
  const [usage, setUsage] = useState<AdminUsageRecord[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAdminUsage()
      .then((res) => setUsage(res.usage))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="stack">
        <h1>Admin Usage</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading /> : null}
        {!loading && usage.length === 0 ? <Empty label="No usage records." /> : null}
        {usage.length > 0 ? (
          <div className="surface">
            <table>
              <thead><tr><th>Usage</th><th>User / Project</th><th>Model</th><th>Provider</th><th>Tokens</th><th>Credits</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>
                {usage.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}<div className="muted">job {row.job_id}</div></td>
                    <td>{row.user_id}<div className="muted">{row.project_id}</div></td>
                    <td>{row.model_slug}</td>
                    <td>{row.provider_id || "—"}</td>
                    <td>{row.total_tokens}<div className="muted">in {row.input_tokens} / out {row.output_tokens}</div></td>
                    <td>cost {row.cost_credits}<div className="muted">provider {row.provider_reward_credits}</div></td>
                    <td><StatusPill value={row.status} /></td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
