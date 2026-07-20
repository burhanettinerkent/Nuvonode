"use client";

import { StatusPill } from "@/components/Display";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { listAdminJobs, type AdminJob } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

export default function AdminRequestsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAdminJobs()
      .then((res) => setJobs(res.jobs))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const queued = useMemo(() => jobs.filter((job) => ["queued", "running", "dispatched"].includes(job.status)).length, [jobs]);
  const failed = useMemo(() => jobs.filter((job) => ["failed", "error", "cancelled"].includes(job.status)).length, [jobs]);
  const settled = useMemo(() => jobs.filter((job) => ["settled", "completed", "success", "succeeded"].includes(job.status)).length, [jobs]);

  return (
    <div className="stack">
      <section className="card stack split-panel" style={{ padding: 32 }}>
        <div className="stack">
          <span className="eyebrow">İstekler</span>
          <h1>İstek, hata ve ödeme izini gör.</h1>
          <p className="muted" style={{ maxWidth: 620 }}>Bu ekran gerçek istek durumunu, hata kodlarını ve kredi sonucunu birlikte gösterir.</p>
        </div>
        <div className="grid stat-strip">
          <div className="metric"><strong>{jobs.length}</strong><span className="muted">Toplam istek</span></div>
          <div className="metric"><strong>{queued}</strong><span className="muted">Aktif</span></div>
          <div className="metric"><strong>{failed}</strong><span className="muted">Hata</span></div>
          <div className="metric"><strong>{settled}</strong><span className="muted">Tamamlanan</span></div>
        </div>
      </section>

      {error ? <ErrorMessage error={error} hint="İstek listesi alınamadı. Sayfayı yenileyip tekrar dene." /> : null}
      {loading ? <Loading label="İstekler yükleniyor..." hint="Son istekler hazırlanıyor." /> : null}
      {!loading && jobs.length === 0 ? <Empty label="Henüz istek yok." hint="İlk istekten sonra burada görünür." /> : null}

      {jobs.length > 0 ? (
        <section className="card stack">
          <div className="surface desktop-only">
            <table>
              <thead><tr><th>Model</th><th>Kullanıcı</th><th>Durum</th><th>Kredi</th><th>Hata</th><th>Tarih</th></tr></thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <strong>{job.model_slug}</strong>
                      <div className="muted">job {job.id}</div>
                      <div className="muted">request {job.request_id}</div>
                    </td>
                    <td>
                      <strong>{job.user_id}</strong>
                      <div className="muted">project {job.project_id}</div>
                      {job.provider_id ? <div className="muted">provider {job.provider_id}</div> : null}
                    </td>
                    <td><StatusPill value={job.status} /></td>
                    <td>{job.actual_cost_credits}<div className="muted">node {job.provider_reward_credits}</div></td>
                    <td>{job.error_code || "—"}{job.error_message ? <div className="muted">{job.error_message}</div> : null}</td>
                    <td>{new Date(job.created_at).toLocaleString()}{job.completed_at ? <div className="muted">bitti {new Date(job.completed_at).toLocaleString()}</div> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-only mobile-list">
            {jobs.map((job) => (
              <div key={job.id} className="mobile-item">
                <div className="row">
                  <strong>{job.model_slug}</strong>
                  <StatusPill value={job.status} />
                </div>
                <div className="meta muted">
                  <div>job {job.id}</div>
                  <div>request {job.request_id}</div>
                  <div>user {job.user_id}</div>
                  <div>project {job.project_id}</div>
                  {job.provider_id ? <div>provider {job.provider_id}</div> : null}
                  {job.provider_instance_id ? <div>instance {job.provider_instance_id}</div> : null}
                  <div>Hata {job.error_code || "—"}</div>
                  {job.error_message ? <div>{job.error_message}</div> : null}
                  <div>{new Date(job.created_at).toLocaleString()}</div>
                </div>
                <div className="row">
                  <span>Kredi {job.actual_cost_credits}</span>
                  <span className="muted">node {job.provider_reward_credits}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
