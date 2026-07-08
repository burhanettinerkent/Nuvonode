"use client";

import { FormEvent, useEffect, useState } from "react";
import { CopyBox } from "@/components/CopyBox";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading, SuccessMessage } from "@/components/State";
import { createAPIKey, listAPIKeys, listModels, listProjects, revokeAPIKey, type APIKey, type Model, type Project } from "@/lib/api";

export default function APIPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectID, setProjectID] = useState("");
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [name, setName] = useState("");
  const [plaintextKey, setPlaintextKey] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([listProjects(), listModels()])
      .then(([projectRes, modelRes]) => {
        setProjects(projectRes.projects);
        setProjectID(projectRes.projects[0]?.id || "");
        setModels(modelRes.models);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!projectID) {
      setKeys([]);
      return;
    }
    listAPIKeys(projectID)
      .then((res) => setKeys(res.api_keys))
      .catch(setError)
  }, [projectID]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess("");
    setPlaintextKey("");
    try {
      const res = await createAPIKey(projectID, name || "Varsayılan");
      setKeys((items) => [res.api_key, ...items]);
      setPlaintextKey(res.plaintext_key);
      setSuccess("API anahtarı oluşturuldu. Kopyala, bir daha gösterilmez.");
      setName("");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  async function revoke(keyID: string) {
    if (!confirm("Bu anahtarı iptal et? Mevcut istemciler çalışmaz.")) return;
    setError(null);
    setSuccess("");
    try {
      await revokeAPIKey(projectID, keyID);
      setKeys((items) => items.map((key) => key.id === keyID ? { ...key, status: "revoked" } : key));
      setSuccess("Anahtar iptal edildi.");
    } catch (err) {
      setError(err);
    }
  }

  return (
    <Shell>
      <div className="stack">
        <h1>API</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {success ? <SuccessMessage message={success} /> : null}
        {loading ? <Loading /> : null}
        {!loading && projects.length === 0 ? <Empty label="Henüz bir uygulaman yok. Önce proje oluştur." /> : null}
        {projects.length > 0 ? (
          <>
            <div className="card stack">
              <div className="field">
                <label htmlFor="project">Uygulama</label>
                <select id="project" value={projectID} onChange={(event) => setProjectID(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </div>
              <form className="stack" onSubmit={submit}>
                <div className="field">
                  <label htmlFor="key-name">Anahtar adı</label>
                  <input id="key-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Varsayılan" />
                </div>
                <button className="button" disabled={saving || !projectID} type="submit">{saving ? "Oluşturuluyor..." : "API anahtarı oluştur"}</button>
              </form>
            </div>
            {plaintextKey ? (() => {
              const example = 'curl https://localhost:18080/v1/chat/completions \\\n  -H "Authorization: Bearer ' + plaintextKey.slice(0, 12) + '..." \\\n  -H "Content-Type: application/json" \\\n  -d \'{"model": "' + (models[0]?.slug || "qwen-7b-instruct") + '","messages":[{"role":"user","content":"Merhaba"}]}\'';
              return (
              <div className="notice warn stack">
                <strong>Bu anahtarı şimdi kopyala. Bir daha gösterilmez.</strong>
                <CopyBox value={plaintextKey} />
                <div className="card stack">
                  <strong>Kullanım örneği:</strong>
                  <pre>{example}</pre>
                  <div className="muted">OpenAI uyumlu API. Herhangi bir OpenAI SDK ile kullanılabilir.</div>
                </div>
              </div>
              );
            })() : null}
            {keys.length > 0 ? (
              <>
                <h2>Anahtarların</h2>
                <div className="surface">
                  <table>
                    <thead><tr><th>Ad</th><th>Ön ek</th><th>Durum</th><th>Oluşturulma</th><th></th></tr></thead>
                    <tbody>
                      {keys.map((key) => (
                        <tr key={key.id}>
                          <td>{key.name}<div className="muted">{key.id}</div></td>
                          <td>{key.prefix}</td>
                          <td><StatusPill value={key.status} /></td>
                          <td>{new Date(key.created_at).toLocaleString()}</td>
                          <td>{key.status === "active" ? <button className="button danger" type="button" onClick={() => revoke(key.id)}>İptal et</button> : null}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
            {models.length > 0 ? (
              <>
                <h2>Modeller</h2>
                <div className="surface">
                  <table>
                    <thead><tr><th>Model</th><th>Durum</th><th>İçerik</th><th>Kredi / 1K token</th></tr></thead>
                    <tbody>
                      {models.map((model) => (
                        <tr key={model.id}>
                          <td><strong>{model.display_name}</strong><div className="muted">{model.slug}</div><div>{model.description}</div></td>
                          <td><StatusPill value={model.status} /></td>
                          <td>{model.context_length}</td>
                          <td>Giriş {model.input_credit_per_1k} / Çıkış {model.output_credit_per_1k}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </Shell>
  );
}
