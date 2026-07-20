"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Empty, ErrorMessage, Loading, SuccessMessage } from "@/components/State";
import { createProject, listProjects, type Project } from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    listProjects()
      .then((res) => setProjects(res.projects))
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess("");
    try {
      const monthlyLimit = limit.trim() ? Number(limit) : null;
      if (monthlyLimit !== null && !Number.isFinite(monthlyLimit)) {
        throw new Error("Geçerli bir aylık limit gir.");
      }
      const res = await createProject(name, monthlyLimit);
      setProjects((items) => [res.project, ...items]);
      setName("");
      setLimit("");
      setSuccess("Proje oluşturuldu.");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <section className="card stack split-panel" style={{ padding: 32 }}>
        <div className="stack">
          <span className="eyebrow">Projeler</span>
          <h1>Önce proje oluştur.</h1>
          <p className="muted" style={{ maxWidth: 620 }}>Tek proje yeter. Sonra anahtar oluşturup ilk isteğini gönder.</p>
          <div className="row">
            <Link className="button" href="#new-project">Proje oluştur</Link>
            <Link className="button secondary" href="/dashboard/api-keys">API'ye dön</Link>
          </div>
        </div>
        <div className="card stack secondary-card" style={{ padding: 22 }}>
          <h2>Kısa sıra</h2>
          <ul className="checklist">
            <li><strong>Adı ver</strong><span className="muted">Projeni ayır.</span></li>
            <li><strong>İstersen limit koy</strong><span className="muted">Boş bırakabilirsin.</span></li>
            <li><strong>Anahtar oluştur</strong><span className="muted">Sonra ilk isteğini gönder.</span></li>
          </ul>
        </div>
      </section>

      <form id="new-project" className="card stack" onSubmit={submit}>
        <h2>Yeni proje</h2>
        <div className="field">
          <label htmlFor="project-name">Proje adı</label>
          <input id="project-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn: Demo API" />
        </div>
        <div className="field">
          <label htmlFor="project-limit">Aylık limit</label>
          <input id="project-limit" min="0" type="number" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="İstersen boş bırak" />
        </div>
        <button className="button" disabled={saving} type="submit">{saving ? "Oluşturuluyor..." : "Proje oluştur"}</button>
      </form>

      {error ? <ErrorMessage error={error} hint="Projeler alınamadı. Sayfayı yenileyip tekrar dene." /> : null}
      {success ? (
        <div className="stack">
          <SuccessMessage message={success} hint="Sıradaki iş: aynı proje için anahtar oluştur." />
          <div className="row">
            <Link className="button" href="/dashboard/api-keys">Anahtar oluştur</Link>
          </div>
        </div>
      ) : null}

      {loading ? <Loading label="Projeler yükleniyor..." hint="Mevcut projelerin hazırlanıyor." /> : null}
      {!loading && projects.length === 0 ? <Empty label="Henüz proje yok." hint="İlk proje burada görünecek." /> : null}

      {projects.length > 0 ? (
        <section className="card stack">
          <div className="surface-head">
            <div>
              <h2>Mevcut projeler</h2>
              <p className="muted">Birini seçip API tarafına dönebilirsin.</p>
            </div>
            <Link className="button secondary" href="/dashboard/api-keys">API'ye dön</Link>
          </div>
          <div className="surface desktop-only">
            <table>
              <thead><tr><th>Proje</th><th>Durum</th><th>Aylık limit</th><th>Bu ay</th><th>Oluşturulma</th></tr></thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.name}</td>
                    <td><StatusPill value={project.status} /></td>
                    <td>{project.monthly_credit_limit ?? "Sınır yok"}</td>
                    <td>{project.current_month_spend}</td>
                    <td>{new Date(project.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-only mobile-list">
            {projects.map((project) => (
              <div key={project.id} className="mobile-item">
                <div className="row">
                  <strong>{project.name}</strong>
                  <StatusPill value={project.status} />
                </div>
                <div className="meta muted">
                  <div>Aylık limit: {project.monthly_credit_limit ?? "Sınır yok"}</div>
                  <div>Bu ay: {project.current_month_spend}</div>
                  <div>{new Date(project.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
