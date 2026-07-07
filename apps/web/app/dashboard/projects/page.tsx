"use client";

import { FormEvent, useEffect, useState } from "react";
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
      const res = await createProject(name, monthlyLimit);
      setProjects((items) => [res.project, ...items]);
      setName("");
      setLimit("");
      setSuccess("Project created.");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <div className="stack">
        <h1>Projects</h1>
        <form className="card stack" onSubmit={submit}>
          <h2>Create project</h2>
          <div className="field">
            <label htmlFor="project-name">Name</label>
            <input id="project-name" required value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="project-limit">Monthly credit limit</label>
            <input id="project-limit" min="0" type="number" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="No limit" />
          </div>
          <button className="button" disabled={saving} type="submit">{saving ? "Creating..." : "Create project"}</button>
        </form>
        {error ? <ErrorMessage error={error} /> : null}
        {success ? <SuccessMessage message={success} /> : null}
        {loading ? <Loading /> : null}
        {!loading && projects.length === 0 ? <Empty label="No projects yet." /> : null}
        {projects.length > 0 ? (
          <table>
            <thead><tr><th>Name</th><th>Status</th><th>Monthly limit</th><th>Current spend</th><th>Created</th></tr></thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.name}<div className="muted">{project.id}</div></td>
                  <td>{project.status}</td>
                  <td>{project.monthly_credit_limit ?? "No limit"}</td>
                  <td>{project.current_month_spend}</td>
                  <td>{new Date(project.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </Shell>
  );
}
