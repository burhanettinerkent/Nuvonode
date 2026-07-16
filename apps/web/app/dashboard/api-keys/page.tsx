"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading, SuccessMessage } from "@/components/State";
import { CopyBox } from "@/components/CopyBox";
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
      .catch(setError);
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
      setSuccess("API anahtarı oluşturuldu. Şimdi kopyala ve ilk isteğini çalıştır.");
      setName("");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  async function revoke(keyID: string) {
    if (!confirm("Bu anahtarı iptal et? Bu anahtarı kullanan istekler durur.")) return;
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

  const example = plaintextKey
    ? 'curl http://localhost:18080/v1/chat/completions \\\n  -H "Authorization: Bearer ' + plaintextKey + '" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"model":"' + (models[0]?.slug || "qwen-7b-instruct") + '","messages":[{"role":"user","content":"Merhaba"}]}\''
    : "";

  return (
    <Shell>
      <div className="stack">
        <div className="stack">
          <h1>API</h1>
          <p className="muted">Bir uygulama seç, anahtarını oluştur ve örnek isteği çalıştır. İlk yanıtını aldıktan sonra sonucu kullanım sayfanda görebilirsin.</p>
        </div>
        {error ? <ErrorMessage error={error} /> : null}
        {success ? <SuccessMessage message={success} /> : null}
        {loading ? <Loading label="API alanı hazırlanıyor..." /> : null}
        {!loading && projects.length === 0 ? (
          <div className="card stack">
            <h2>Önce bir uygulama oluştur</h2>
            <p className="muted">API anahtarın bir uygulamaya bağlı çalışır. İlk adım olarak uygulama oluştur, sonra burada anahtarını ekle.</p>
            <div className="row">
              <Link className="button" href="/dashboard/projects">Uygulama oluştur</Link>
            </div>
          </div>
        ) : null}
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
            {plaintextKey ? (
              <div className="notice warn stack">
                <strong>Bu anahtarı şimdi kopyala. Bir daha gösterilmez.</strong>
                <CopyBox value={plaintextKey} />
                <div className="card stack">
                  <strong>İlk istek için örnek komut</strong>
                  <CopyBox value={example} />
                  <div className="muted">Komutu çalıştırdıktan sonra sonucu kullanım sayfanda görebilirsin.</div>
                  <div className="row">
                    <Link className="button secondary" href="/dashboard/usage">Kullanımı aç</Link>
                  </div>
                </div>
              </div>
            ) : null}
            {keys.length > 0 ? (
              <>
                <h2>Anahtarların</h2>
                <div className="surface">
                  <table>
                    <thead><tr><th>Ad</th><th>Ön ek</th><th>Durum</th><th>Oluşturulma</th><th></th></tr></thead>
                    <tbody>
                      {keys.map((key) => (
                        <tr key={key.id}>
                          <td>{key.name}</td>
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
            ) : (
              !plaintextKey && !loading ? <Empty label="Henüz API anahtarın yok. Bir anahtar oluşturup ilk isteğini hemen çalıştırabilirsin." /> : null
            )}
            {models.length > 0 ? (
              <>
                <h2>Başlamak için modeller</h2>
                <div className="surface">
                  <table>
                    <thead><tr><th>Model</th><th>Durum</th><th>Bağlam</th><th>Kredi / 1K token</th></tr></thead>
                    <tbody>
                      {models.map((model) => (
                        <tr key={model.id}>
                          <td><strong>{model.display_name}</strong><div className="muted">{model.description}</div><div className="muted">{model.slug}</div></td>
                          <td><StatusPill value={model.status} /></td>
                          <td>{model.context_length}</td>
                          <td>Giriş {model.input_credit_per_1k} / Çıkış {model.output_credit_per_1k}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              !loading ? <Empty label="Şu anda kullanılabilir model görünmüyor. Onaylı ve çevrimiçi node geldiğinde burada listelenir." /> : null
            )}
          </>
        ) : null}
      </div>
    </Shell>
  );
}
