"use client";

import { FormEvent, useEffect, useState } from "react";
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
        <h1>Kullanım</h1>
        <form className="card grid" onSubmit={submit}>
          <div className="field">
            <label htmlFor="project">Uygulama</label>
            <select id="project" value={projectID} onChange={(event) => setProjectID(event.target.value)}>
              <option value="">Tümü</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="model">Model</label>
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
        {loading ? <Loading /> : null}
        {!loading && usage.length === 0 ? <Empty label="Henüz hiç kullanım kaydı yok." /> : null}
        {usage.length > 0 ? (
          <div className="surface">
            <table>
              <thead><tr><th>Model</th><th>Token</th><th>Kredi</th><th>Durum</th><th>Tarih</th></tr></thead>
              <tbody>
                {usage.map((row) => (
                  <tr key={row.id}>
                    <td>{row.model_slug}</td>
                    <td>{row.total_tokens} <span className="muted">(giriş {row.input_tokens} / çıkış {row.output_tokens})</span></td>
                    <td>{row.cost_credits}</td>
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
