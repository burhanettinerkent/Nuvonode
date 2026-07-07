"use client";

import { FormEvent, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { createAdminModel, listAdminModels, pauseAdminModel, updateAdminModel, type Model } from "@/lib/api";

export default function AdminModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [family, setFamily] = useState("");
  const [status, setStatus] = useState("active");
  const [editingID, setEditingID] = useState("");
  const [editingStatus, setEditingStatus] = useState("active");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    listAdminModels()
      .then((res) => setModels(res.models))
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await createAdminModel({ slug, display_name: displayName, family, status, community_allowed: true });
      setModels((items) => [res.model, ...items]);
      setSlug("");
      setDisplayName("");
      setFamily("");
      setStatus("active");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  async function saveStatus() {
    if (!editingID) return;
    setError(null);
    try {
      const res = await updateAdminModel(editingID, { status: editingStatus });
      setModels((items) => items.map((item) => item.id === editingID ? res.model : item));
      setEditingID("");
    } catch (err) {
      setError(err);
    }
  }

  async function pause(id: string) {
    setError(null);
    try {
      await pauseAdminModel(id);
      setModels((items) => items.map((item) => item.id === id ? { ...item, status: "paused" } : item));
    } catch (err) {
      setError(err);
    }
  }

  return (
    <Shell>
      <div className="stack">
        <h1>Admin Models</h1>
        <form className="card stack" onSubmit={submit}>
          <h2>Create model</h2>
          <div className="grid">
            <div className="field"><label htmlFor="slug">Slug</label><input id="slug" required value={slug} onChange={(event) => setSlug(event.target.value)} /></div>
            <div className="field"><label htmlFor="display-name">Display name</label><input id="display-name" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></div>
            <div className="field"><label htmlFor="family">Family</label><input id="family" required value={family} onChange={(event) => setFamily(event.target.value)} /></div>
            <div className="field"><label htmlFor="status">Status</label><select id="status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">active</option><option value="paused">paused</option><option value="deprecated">deprecated</option></select></div>
          </div>
          <button className="button" disabled={saving} type="submit">{saving ? "Creating..." : "Create model"}</button>
        </form>
        <div className="card row">
          <select value={editingID} onChange={(event) => {
            const id = event.target.value;
            setEditingID(id);
            setEditingStatus(models.find((model) => model.id === id)?.status || "active");
          }}>
            <option value="">Select model to update status</option>
            {models.map((model) => <option key={model.id} value={model.id}>{model.slug}</option>)}
          </select>
          <select value={editingStatus} onChange={(event) => setEditingStatus(event.target.value)}>
            <option value="active">active</option><option value="paused">paused</option><option value="deprecated">deprecated</option>
          </select>
          <button className="button secondary" disabled={!editingID} type="button" onClick={saveStatus}>Update status</button>
        </div>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading /> : null}
        {!loading && models.length === 0 ? <Empty label="No models." /> : null}
        {models.length > 0 ? (
          <table>
            <thead><tr><th>Model</th><th>Status</th><th>Context</th><th>Credits / 1K</th><th>Community</th><th>Actions</th></tr></thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id}>
                  <td><strong>{model.display_name}</strong><div className="muted">{model.slug}</div><div>{model.id}</div></td>
                  <td>{model.status}</td>
                  <td>{model.context_length}</td>
                  <td>In {model.input_credit_per_1k} / Out {model.output_credit_per_1k}</td>
                  <td>{model.community_allowed ? "Allowed" : "Not allowed"}</td>
                  <td>{model.status !== "paused" ? <button className="button secondary" type="button" onClick={() => pause(model.id)}>Pause</button> : <span className="pill warn">Paused</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </Shell>
  );
}
