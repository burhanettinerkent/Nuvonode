"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { listProjects, listUsage, type Project, type UsageRecord } from "@/lib/api";

function toRFC3339(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export default function UsagePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [projectID, setProjectID] = useState("");
  const [model, setModel] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const projectNames = useMemo(() => Object.fromEntries(projects.map((project) => [project.id, project.name])), [projects]);

  function load(filter = { projectID, model, from, to }) {
    setLoading(true);
    setError(null);
    listUsage({ projectID: filter.projectID, model: filter.model, from: toRFC3339(filter.from), to: toRFC3339(filter.to) })
      .then((res) => setUsage(res.usage))
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.all([listProjects(), listUsage()])
      .then(([projectRes, usageRes]) => {
        setProjects(projectRes.projects);
        setUsage(usageRes.usage);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    load();
  }

  const totalCredits = usage.reduce((sum, row) => sum + row.cost_credits, 0);
  const settledCount = usage.filter((row) => ["settled", "completed", "success", "succeeded"].includes(row.status)).length;
  const latestRequest = usage[0]?.created_at;

  return (
    <div className="stack">
      <section className="card stack" style={{ padding: 32 }}>
        <div className="split-panel">
          <div className="stack">
            <span className="eyebrow">İstekler</span>
            <h1>İsteklerini gör.</h1>
            <p className="muted" style={{ maxWidth: 620 }}>Model, durum, tarih ve kredi burada görünür.</p>
            <div className="row">
              <Link className="button" href="/dashboard/api-keys">API'ye dön</Link>
              <Link className="button secondary" href="/dashboard/credits">Bakiyeyi gör</Link>
            </div>
          </div>
          <div className="grid stat-strip">
            <div className="metric"><strong>{usage.length}</strong><span className="muted">Toplam kayıt</span></div>
            <div className="metric"><strong>{settledCount}</strong><span className="muted">Tamamlanan</span></div>
            <div className="metric"><strong>{totalCredits}</strong><span className="muted">Toplam kredi</span></div>
            <div className="metric"><strong>{latestRequest ? new Date(latestRequest).toLocaleDateString() : "—"}</strong><span className="muted">Son kayıt</span></div>
          </div>
        </div>
      </section>

      <form className="card stack" onSubmit={submit}>
        <div className="surface-head">
          <div>
            <h2>Filtreler</h2>
            <p className="muted">Gerekirse proje, model veya tarih seç.</p>
          </div>
        </div>
        <div className="grid">
          <div className="field">
            <label htmlFor="project">Proje</label>
            <select id="project" value={projectID} onChange={(event) => setProjectID(event.target.value)}>
              <option value="">Tümü</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="model">Model adı</label>
            <input id="model" value={model} onChange={(event) => setModel(event.target.value)} placeholder="Tüm modeller" />
          </div>
          <div className="field">
            <label htmlFor="from">Başlangıç</label>
            <input id="from" type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="to">Bitiş</label>
            <input id="to" type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
        </div>
        <div className="row">
          <button className="button" type="submit">Filtrele</button>
        </div>
      </form>

      {error ? <ErrorMessage error={error} hint="İstek listesi alınamadı. Sayfayı yenileyip tekrar dene." /> : null}
      {loading ? <Loading label="İstekler yükleniyor..." hint="Son isteklerin hazırlanıyor." /> : null}

      {!loading && usage.length === 0 ? (
        <div className="card stack">
          <Empty label="Henüz istek yok." hint="İlk isteği gönderdikten sonra kayıtlar burada görünür." />
          <div className="row">
            <Link className="button" href="/dashboard/api-keys">API'ye git</Link>
          </div>
        </div>
      ) : null}

      {usage.length > 0 ? (
        <section className="card stack">
          <div className="surface-head">
            <div>
              <h2>İstek geçmişi</h2>
              <p className="muted">Yeni kayıtlar üstte.</p>
            </div>
          </div>
          <div className="surface desktop-only">
            <table>
              <thead><tr><th>Proje</th><th>Model</th><th>Durum</th><th>Kredi</th><th>Tarih</th></tr></thead>
              <tbody>
                {usage.map((row) => (
                  <tr key={row.id}>
                    <td>{projectNames[row.project_id] || "—"}</td>
                    <td>
                      <strong>{row.model_slug}</strong>
                      <div className="muted">Toplam {row.total_tokens} token</div>
                      {row.latency_ms ? <div className="muted">Yanıt {row.latency_ms} ms</div> : null}
                    </td>
                    <td><StatusPill value={row.status} /></td>
                    <td>{row.cost_credits}</td>
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
                  <div>Proje: {projectNames[row.project_id] || "—"}</div>
                  <div>{new Date(row.created_at).toLocaleString()}</div>
                  <div>Toplam {row.total_tokens} token</div>
                  {row.latency_ms ? <div>Yanıt {row.latency_ms} ms</div> : null}
                </div>
                <div className="row">
                  <span>Kredi {row.cost_credits}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
