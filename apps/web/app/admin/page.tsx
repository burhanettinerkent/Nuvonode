"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/Display";
import { ErrorMessage, Loading } from "@/components/State";
import { listAdminJobs, listAdminModels, listAdminProviders, listAdminUsage, listPendingProviderModels, type AdminJob, type AdminUsageRecord, type Model, type Provider, type ProviderModelAdvertisement } from "@/lib/api";

export default function AdminPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [usage, setUsage] = useState<AdminUsageRecord[]>([]);
  const [pendingModels, setPendingModels] = useState<ProviderModelAdvertisement[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listAdminProviders(), listAdminModels(), listAdminJobs(), listAdminUsage(), listPendingProviderModels()])
      .then(([providerRes, modelRes, jobRes, usageRes, pendingModelRes]) => {
        setProviders(providerRes.providers);
        setModels(modelRes.models);
        setJobs(jobRes.jobs);
        setUsage(usageRes.usage);
        setPendingModels(pendingModelRes.provider_model_advertisements);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const pendingProviders = useMemo(() => providers.filter((provider) => provider.approval_status === "pending"), [providers]);
  const runningJobs = useMemo(() => jobs.filter((job) => ["queued", "running", "dispatched"].includes(job.status)), [jobs]);
  const failedJobs = useMemo(() => jobs.filter((job) => ["failed", "error", "cancelled"].includes(job.status)), [jobs]);
  const recentJobs = useMemo(() => jobs.slice(0, 4), [jobs]);
  const recentUsage = useMemo(() => usage.slice(0, 3), [usage]);

  return (
    <div className="stack">
      <section className="card stack" style={{ padding: 32 }}>
        <div className="split-panel">
          <div className="stack">
            <span className="eyebrow">İnceleme</span>
            <h1>Önce kuyruğu temizle.</h1>
            <p className="muted" style={{ maxWidth: 620 }}>Bekleyen node ve model işleri önce gelir. Sonra istek ve kullanım kayıtlarına bakarsın.</p>
            <div className="row">
              <Link className="button" href="/admin/providers">İnceleme kuyruğunu aç</Link>
              <Link className="button secondary" href="/admin/jobs">İstekleri aç</Link>
            </div>
          </div>
          <div className="grid stat-strip">
            <div className="metric"><strong>{pendingProviders.length}</strong><span className="muted">Bekleyen node</span></div>
            <div className="metric"><strong>{pendingModels.length}</strong><span className="muted">Bekleyen model</span></div>
            <div className="metric"><strong>{runningJobs.length}</strong><span className="muted">Aktif istek</span></div>
            <div className="metric"><strong>{failedJobs.length}</strong><span className="muted">Hata</span></div>
          </div>
        </div>
      </section>

      {loading ? <Loading label="Yönetim kuyruğu hazırlanıyor..." hint="Node, model ve istek kayıtları yükleniyor." /> : null}
      {error ? <ErrorMessage error={error} hint="Yönetim verileri alınamadı. Sayfayı yenileyip tekrar dene." /> : null}

      {!loading && !error ? (
        <>
          <section className="grid queue-grid">
            <div className="card stack">
              <span className={pendingProviders.length > 0 ? "pill warn" : "pill ok"}>{pendingProviders.length > 0 ? `${pendingProviders.length} bekliyor` : "Temiz"}</span>
              <h3>Node kuyruğu</h3>
              <p className="muted">Bekleyen node’ları kapat. Sonra diğer kayıtlara geç.</p>
              <Link className="button secondary" href="/admin/providers">Node incele</Link>
            </div>
            <div className="card stack secondary-card">
              <span className={pendingModels.length > 0 ? "pill warn" : "pill ok"}>{pendingModels.length > 0 ? `${pendingModels.length} bekliyor` : "Temiz"}</span>
              <h3>Model kuyruğu</h3>
              <p className="muted">Bekleyen model ilanlarını onayla ya da reddet.</p>
              <Link className="button secondary" href="/admin/provider-models">Model kuyruğunu aç</Link>
            </div>
            <div className="card stack secondary-card">
              <span className={failedJobs.length > 0 ? "pill warn" : "pill"}>{runningJobs.length} aktif / {failedJobs.length} hata</span>
              <h3>İstek sinyalleri</h3>
              <p className="muted">Çalışan ve hatalı işler operasyon ritmini gösterir.</p>
              <Link className="button secondary" href="/admin/jobs">İstekleri aç</Link>
            </div>
          </section>

          <section className="grid stat-strip">
            <div className="metric"><strong>{providers.length}</strong><span className="muted">Toplam node</span></div>
            <div className="metric"><strong>{models.length}</strong><span className="muted">Katalog model</span></div>
            <div className="metric"><strong>{jobs.length}</strong><span className="muted">Toplam istek</span></div>
            <div className="metric"><strong>{usage.length}</strong><span className="muted">Kullanım kaydı</span></div>
          </section>

          <section className="split-panel">
            <div className="card stack">
              <div className="surface-head">
                <div>
                  <h2>Son istekler</h2>
                  <p className="muted">Yeni işler üstte görünür.</p>
                </div>
              </div>
              {recentJobs.length === 0 ? <div className="muted">Henüz istek görünmüyor.</div> : recentJobs.map((job) => (
                <div key={job.id} className="metric">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <strong>{job.model_slug}</strong>
                    <StatusPill value={job.status} />
                  </div>
                  <div className="muted">job {job.id}</div>
                  <div className="muted">request {job.request_id}</div>
                  <div className="muted">{new Date(job.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="card stack secondary-card">
              <div className="surface-head">
                <div>
                  <h2>Son kullanım kayıtları</h2>
                  <p className="muted">Maliyet ve node kazancı burada görünür.</p>
                </div>
              </div>
              {recentUsage.length === 0 ? <div className="muted">Henüz kullanım kaydı görünmüyor.</div> : recentUsage.map((row) => (
                <div key={row.id} className="metric">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <strong>{row.model_slug}</strong>
                    <StatusPill value={row.status} />
                  </div>
                  <div className="muted">job {row.job_id}</div>
                  <div className="muted">project {row.project_id}</div>
                  <div className="muted">kredi {row.cost_credits} / node {row.provider_reward_credits}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
