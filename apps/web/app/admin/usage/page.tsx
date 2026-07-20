"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/Display";
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

  const totalCredits = useMemo(() => usage.reduce((sum, row) => sum + row.cost_credits, 0), [usage]);
  const totalProviderRewards = useMemo(() => usage.reduce((sum, row) => sum + row.provider_reward_credits, 0), [usage]);

  return (
    <div className="stack">
      <section className="card stack split-panel" style={{ padding: 32 }}>
        <div className="stack">
          <span className="eyebrow">Kullanım</span>
          <h1>Kullanım ve node kazancını gör.</h1>
          <p className="muted" style={{ maxWidth: 620 }}>Bu kayıtlar kullanıcı maliyetini ve node kazancını birlikte gösterir.</p>
        </div>
        <div className="grid stat-strip">
          <div className="metric"><strong>{usage.length}</strong><span className="muted">Kayıt</span></div>
          <div className="metric"><strong>{totalCredits}</strong><span className="muted">Toplam maliyet</span></div>
          <div className="metric"><strong>{totalProviderRewards}</strong><span className="muted">Toplam node kazancı</span></div>
        </div>
      </section>

      {error ? <ErrorMessage error={error} hint="Kullanım kayıtları alınamadı. Sayfayı yenileyip tekrar dene." /> : null}
      {loading ? <Loading label="Kullanım kayıtları yükleniyor..." hint="Son kayıtlar hazırlanıyor." /> : null}
      {!loading && usage.length === 0 ? <Empty label="Henüz kullanım kaydı yok." hint="İlk tamamlanan istekten sonra burada görünür." /> : null}

      {usage.length > 0 ? (
        <section className="card stack">
          <div className="surface-head">
            <div>
              <h2>Kullanım kayıtları</h2>
              <p className="muted">Model, maliyet, node ve durum birlikte görünür.</p>
            </div>
          </div>
          <div className="surface desktop-only">
            <table>
              <thead><tr><th>Model</th><th>Kullanıcı / Proje</th><th>Node</th><th>Token</th><th>Kredi</th><th>Durum</th><th>Tarih</th></tr></thead>
              <tbody>
                {usage.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.model_slug}</strong>
                      <div className="muted">model {row.model_id}</div>
                      <div className="muted">kayıt {row.id}</div>
                    </td>
                    <td>
                      <strong>{row.user_id}</strong>
                      <div className="muted">project {row.project_id}</div>
                      <div className="muted">job {row.job_id}</div>
                    </td>
                    <td>{row.provider_id || "—"}{row.provider_instance_id ? <div className="muted">instance {row.provider_instance_id}</div> : null}</td>
                    <td>{row.total_tokens}<div className="muted">giriş {row.input_tokens} / çıkış {row.output_tokens}</div></td>
                    <td>{row.cost_credits}<div className="muted">node {row.provider_reward_credits}</div></td>
                    <td><StatusPill value={row.status} /></td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-only mobile-list">
            {usage.map((row) => (
              <div key={row.id} className="mobile-item">
                <div className="row">
                  <strong>{row.model_slug}</strong>
                  <StatusPill value={row.status} />
                </div>
                <div className="meta muted">
                  <div>user {row.user_id}</div>
                  <div>project {row.project_id}</div>
                  <div>job {row.job_id}</div>
                  <div>provider {row.provider_id || "—"}</div>
                  {row.provider_instance_id ? <div>instance {row.provider_instance_id}</div> : null}
                  <div>{row.total_tokens} token</div>
                  <div>giriş {row.input_tokens} / çıkış {row.output_tokens}</div>
                  <div>{new Date(row.created_at).toLocaleString()}</div>
                </div>
                <div className="row">
                  <span>Kredi {row.cost_credits}</span>
                  <span className="muted">node {row.provider_reward_credits}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
