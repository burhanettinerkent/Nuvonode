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
        <h1>Kullanım kayıtları</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading label="Kullanım kayıtları yükleniyor..." /> : null}
        {!loading && usage.length === 0 ? <Empty label="Henüz kullanım kaydı yok." /> : null}
        {usage.length > 0 ? (
          <div className="surface">
            <table>
              <thead><tr><th>Kayıt</th><th>Kullanıcı / Uygulama</th><th>Model</th><th>Node</th><th>Token</th><th>Kredi</th><th>Durum</th><th>Tarih</th></tr></thead>
              <tbody>
                {usage.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}<div className="muted">İstek kimliği yönetim kayıtlarında tutulur</div></td>
                    <td>{row.user_id}<div className="muted">Uygulama kimliği yönetim kayıtlarında tutulur</div></td>
                    <td>{row.model_slug}</td>
                    <td>{row.provider_id ? "Node bağlı" : "—"}</td>
                    <td>{row.total_tokens}<div className="muted">giriş {row.input_tokens} / çıkış {row.output_tokens}</div></td>
                    <td>{row.cost_credits}<div className="muted">node {row.provider_reward_credits}</div></td>
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
