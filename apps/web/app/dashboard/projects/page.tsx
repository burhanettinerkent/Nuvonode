"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
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
        throw new Error("Geçerli bir harcama limiti gir.");
      }
      const res = await createProject(name, monthlyLimit);
      setProjects((items) => [res.project, ...items]);
      setName("");
      setLimit("");
      setSuccess("Uygulama oluşturuldu. Sıradaki adım: API anahtarı oluştur.");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <div className="stack">
        <div className="stack">
          <h1>Uygulamalar</h1>
          <p className="muted">İlk API anahtarını oluşturmadan önce bir uygulama ekle. Böylece isteklerini ayrı ayrı takip edebilirsin.</p>
        </div>
        <form className="card stack" onSubmit={submit}>
          <h2>Yeni uygulama oluştur</h2>
          <div className="field">
            <label htmlFor="project-name">Uygulama adı</label>
            <input id="project-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn: Web uygulamam" />
          </div>
          <div className="field">
            <label htmlFor="project-limit">Harcama limiti</label>
            <input id="project-limit" min="0" type="number" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="İstersen boş bırak" />
          </div>
          <button className="button" disabled={saving} type="submit">{saving ? "Oluşturuluyor..." : "Uygulama oluştur"}</button>
        </form>
        {error ? <ErrorMessage error={error} /> : null}
        {success ? (
          <div className="stack">
            <SuccessMessage message={success} />
            <div className="row">
              <Link className="button" href="/dashboard/api-keys">API anahtarına geç</Link>
            </div>
          </div>
        ) : null}
        {loading ? <Loading label="Uygulamalar yükleniyor..." /> : null}
        {!loading && projects.length === 0 ? <Empty label="Henüz uygulaman yok. Önce bir uygulama oluştur, sonra API anahtarını ekleyip ilk isteğini yap." /> : null}
        {projects.length > 0 ? (
          <div className="surface">
            <table>
              <thead><tr><th>Uygulama</th><th>Durum</th><th>Harcama limiti</th><th>Bu ay</th><th>Oluşturulma</th></tr></thead>
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
        ) : null}
      </div>
    </Shell>
  );
}
