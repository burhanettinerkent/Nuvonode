"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
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

  return (
    <Shell>
      <div className="stack">
        <div className="stack">
          <h1>Kullanım</h1>
          <p className="muted">İsteklerin burada görünür. Hangi uygulamanın hangi modeli çağırdığını, ne kadar kredi harcadığını ve sonucun ne olduğunu hızlıca görebilirsin.</p>
        </div>
        <form className="card grid" onSubmit={submit}>
          <div className="field">
            <label htmlFor="project">Uygulama</label>
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
          <button className="button" type="submit">Filtrele</button>
        </form>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading label="Kullanım hazırlanıyor..." /> : null}
        {!loading && usage.length === 0 ? (
          <div className="card stack">
            <Empty label="Henüz hiç API isteği görünmüyor." />
            <div className="muted">Önce API sayfasından anahtar oluştur, örnek komutu çalıştır, sonra sonucu burada gör.</div>
            <div className="row">
              <Link className="button" href="/dashboard/api-keys">API sayfasına git</Link>
            </div>
          </div>
        ) : null}
        {usage.length > 0 ? (
          <>
            <div className="surface desktop-only">
              <table>
                <thead><tr><th>Uygulama</th><th>Model</th><th>Kredi</th><th>Durum</th><th>Tarih</th></tr></thead>
                <tbody>
                  {usage.map((row) => (
                    <tr key={row.id}>
                      <td>{projectNames[row.project_id] || "—"}</td>
                      <td>
                        <strong>{row.model_slug}</strong>
                        <div className="muted">{row.total_tokens} token</div>
                        <div className="muted">giriş {row.input_tokens} / çıkış {row.output_tokens}</div>
                        {row.latency_ms ? <div className="muted">yanıt {row.latency_ms} ms</div> : null}
                      </td>
                      <td>{row.cost_credits}</td>
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
                    <div>Uygulama: {projectNames[row.project_id] || "—"}</div>
                    <div>{row.total_tokens} token</div>
                    <div>Giriş {row.input_tokens} / Çıkış {row.output_tokens}</div>
                    {row.latency_ms ? <div>Yanıt {row.latency_ms} ms</div> : null}
                  </div>
                  <div className="row">
                    <span>Kredi {row.cost_credits}</span>
                    <span className="muted">{new Date(row.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </Shell>
  );
}
