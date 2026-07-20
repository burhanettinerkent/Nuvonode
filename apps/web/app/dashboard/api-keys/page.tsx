"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CopyBox } from "@/components/CopyBox";
import { StatusPill } from "@/components/Display";
import { PrivacyNotice } from "@/components/PrivacyNotice";
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
      setSuccess("Anahtar oluşturuldu.");
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

  const selectedProject = useMemo(() => projects.find((project) => project.id === projectID) || null, [projectID, projects]);
  const activeKeys = keys.filter((key) => key.status === "active");
  const starterModel = models[0]?.slug || "qwen-7b-instruct";
  const example = `curl http://localhost:18080/v1/chat/completions \\
  -H "Authorization: Bearer ${plaintextKey || "pvn_kopyaladigin_anahtar"}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${starterModel}","messages":[{"role":"user","content":"Merhaba"}]}'`;
  const showProjectPicker = projects.length > 1;

  return (
    <div className="stack">
      <section className="card stack" style={{ padding: 32 }}>
        <div className="split-panel">
          <div className="stack">
            <span className="eyebrow">API</span>
            <h1>Anahtar oluştur, istek gönder.</h1>
            <p className="muted" style={{ maxWidth: 620 }}>Proje seç. Anahtarı kopyala. İlk isteğini aynı yerden başlat.</p>
            <div className="row">
              <Link className="button" href={projects.length > 0 ? "#create-key" : "/dashboard/projects"}>{projects.length > 0 ? "Anahtar oluştur" : "Proje oluştur"}</Link>
              <Link className="button secondary" href="/dashboard/usage">İstekleri gör</Link>
            </div>
          </div>

          <div className="card stack secondary-card" style={{ padding: 22 }}>
            <div className="surface-head">
              <div>
                <h2>İlk komut</h2>
                <p className="muted">{plaintextKey ? "Anahtar hazır. Komutu şimdi kopyalayabilirsin." : "Anahtar hazır olunca örnek komut burada görünür."}</p>
              </div>
              <span className="pill">API</span>
            </div>
            <CopyBox value={example} />
            <div className="grid stat-strip">
              <div className="metric"><strong>{projects.length}</strong><span className="muted">Proje</span></div>
              <div className="metric"><strong>{activeKeys.length}</strong><span className="muted">Aktif anahtar</span></div>
            </div>
          </div>
        </div>
      </section>

      {error ? <ErrorMessage error={error} hint="API verileri alınamadı. Sayfayı yenileyip tekrar dene." /> : null}
      {success ? <SuccessMessage message={success} hint="Secret yalnızca bu ekranda bir kez görünür." /> : null}
      {loading ? <Loading label="API hazırlanıyor..." hint="Projeler, anahtarlar ve modeller yükleniyor." /> : null}
      <PrivacyNotice />

      {!loading && projects.length === 0 ? (
        <div className="card stack">
          <Empty label="Önce proje oluştur." hint="İlk anahtar için tek proje yeter." />
          <div className="row">
            <Link className="button" href="/dashboard/projects">Proje oluştur</Link>
          </div>
        </div>
      ) : null}

      {projects.length > 0 ? (
        <>
          <section className="split-panel">
            <div className="card stack">
              <div className="surface-head">
                <div>
                  <h2>{showProjectPicker ? "Proje seç" : "Seçili proje"}</h2>
                  <p className="muted">İlk istek için tek proje yeter.</p>
                </div>
              </div>
              {showProjectPicker ? (
                <div className="field">
                  <label htmlFor="project">Proje</label>
                  <select id="project" value={projectID} onChange={(event) => setProjectID(event.target.value)}>
                    {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="metric">
                  <strong>{selectedProject?.name || "—"}</strong>
                  <span className="muted">Bu ay {selectedProject?.current_month_spend ?? 0} kredi harcadı.</span>
                </div>
              )}
              <div className="row">
                <Link className="button secondary" href="/dashboard/projects">Yeni proje</Link>
              </div>
            </div>

            <div id="create-key" className="card stack secondary-card">
              <div className="surface-head">
                <div>
                  <h2>Anahtar oluştur</h2>
                  <p className="muted">Secret yalnızca bir kez görünür.</p>
                </div>
                {activeKeys.length > 0 ? <span className="pill ok">{activeKeys.length} aktif</span> : <span className="pill warn">Henüz yok</span>}
              </div>
              <form className="stack" onSubmit={submit}>
                <div className="field">
                  <label htmlFor="key-name">Anahtar adı</label>
                  <input id="key-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Varsayılan" />
                </div>
                <button className="button" disabled={saving || !projectID} type="submit">{saving ? "Oluşturuluyor..." : "Anahtar oluştur"}</button>
              </form>
            </div>
          </section>

          {plaintextKey ? (
            <section className="notice warn stack">
              <strong>Bu anahtarı şimdi kopyala. Bir daha görünmez.</strong>
              <CopyBox value={plaintextKey} />
              <div className="card stack">
                <strong>Örnek komut</strong>
                <CopyBox value={example} />
                <div className="row">
                  <Link className="button" href="/dashboard/usage">İstekleri gör</Link>
                  <Link className="button secondary" href="/dashboard/credits">Bakiyeyi gör</Link>
                </div>
              </div>
            </section>
          ) : null}

          <section className="split-panel">
            <div className="card stack">
              <div className="surface-head">
                <div>
                  <h2>Mevcut anahtarlar</h2>
                  <p className="muted">Secret yalnızca oluştururken görünür.</p>
                </div>
              </div>
              {keys.length > 0 ? (
                <>
                  <div className="surface desktop-only">
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
                  <div className="mobile-only mobile-list">
                    {keys.map((key) => (
                      <div key={key.id} className="mobile-item">
                        <div className="row">
                          <strong>{key.name}</strong>
                          <StatusPill value={key.status} />
                        </div>
                        <div className="meta muted">
                          <div>Ön ek: {key.prefix}</div>
                          <div>{new Date(key.created_at).toLocaleString()}</div>
                        </div>
                        {key.status === "active" ? <button className="button danger" type="button" onClick={() => revoke(key.id)}>İptal et</button> : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                !plaintextKey ? <Empty label="Henüz anahtar yok." hint="İlk anahtarını oluşturup komutu hemen kopyalayabilirsin." /> : null
              )}
            </div>

            <div className="card stack secondary-card">
              <div className="surface-head">
                <div>
                  <h2>Başlamak için modeller</h2>
                  <p className="muted">Kısa bir model seç. Sonra aynı adı örnek komutta kullan.</p>
                </div>
              </div>
              {models.length > 0 ? (
                <div className="stack">
                  {models.slice(0, 4).map((model) => (
                    <div key={model.id} className="metric">
                      <strong>{model.display_name}</strong>
                      <span className="muted">API adı: {model.slug}</span>
                      <span className="muted">{model.description}</span>
                      <div className="row" style={{ marginTop: 8 }}>
                        <span className="muted">Giriş {model.input_credit_per_1k} / Çıkış {model.output_credit_per_1k}</span>
                        {model.status !== "active" ? <StatusPill value={model.status} /> : null}
                      </div>
                    </div>
                  ))}
                  <div className="row">
                    <Link className="button secondary" href="/dashboard/models">Tüm modelleri gör</Link>
                  </div>
                </div>
              ) : (
                <Empty label="Şu anda model görünmüyor." hint="Biraz sonra tekrar kontrol et." />
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
