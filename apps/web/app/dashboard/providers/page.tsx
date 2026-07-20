"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CopyBox } from "@/components/CopyBox";
import { CreditNotice } from "@/components/CreditNotice";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { StatusPill } from "@/components/Display";
import { Empty, ErrorMessage, Loading, SuccessMessage } from "@/components/State";
import { createProvider, listProviders, type Provider } from "@/lib/api";

function setupCommand(name: string, token: string) {
  return `cd apps/provider-node\ngo run ./cmd/provider-node init --server http://localhost:18080 --token ${token} --name "${name}"\ngo run ./cmd/provider-node doctor\ngo run ./cmd/provider-node serve`;
}

function NodeCard({ provider }: { provider: Provider }) {
  if (provider.instance_status === "online" && provider.model_names?.length > 0) {
    return (
      <div className="card stack">
        <div className="row">
          <strong>{provider.name}</strong>
          <StatusPill value={provider.instance_status} />
          <StatusPill value={provider.approval_status} />
        </div>
        <div className="muted">Hazır. İstek alabilir.</div>
        <div className="row muted">
          <span>Modeller: {provider.model_names.join(", ")}</span>
          <span>Son sinyal: {provider.last_heartbeat_at ? new Date(provider.last_heartbeat_at).toLocaleString() : "—"}</span>
        </div>
      </div>
    );
  }

  if (provider.instance_status === "online") {
    return (
      <div className="card stack secondary-card">
        <div className="row">
          <strong>{provider.name}</strong>
          <StatusPill value={provider.instance_status} />
          <StatusPill value={provider.approval_status} />
        </div>
        <div className="muted">Bağlı. Model onayı bekleniyor.</div>
        <div className="muted">Son sinyal: {provider.last_heartbeat_at ? new Date(provider.last_heartbeat_at).toLocaleString() : "—"}</div>
      </div>
    );
  }

  return (
    <div className="card stack secondary-card">
      <div className="row">
        <strong>{provider.name}</strong>
        <span className="pill warn">Bağlı değil</span>
        <StatusPill value={provider.approval_status} />
      </div>
      <div className="muted">Şu an bağlı değil. Son kurulum komutunu yeniden çalıştır.</div>
      <div className="muted">Son sinyal: {provider.last_heartbeat_at ? new Date(provider.last_heartbeat_at).toLocaleString() : "Henüz yok"}</div>
    </div>
  );
}

export default function NodesPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [commands, setCommands] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    listProviders()
      .then((res) => setProviders(res.providers))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess("");
    setToken("");
    setCommands("");
    try {
      const res = await createProvider(name, null, false);
      setProviders((items) => [{ ...res.provider, instance_status: null, last_heartbeat_at: null, model_names: [] }, ...items]);
      setToken(res.plaintext_token);
      setCommands(setupCommand(name, res.plaintext_token));
      setName("");
      setSuccess("Node oluşturuldu. Anahtarı kopyala, komutu çalıştır.");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  const onlineProviders = useMemo(() => providers.filter((provider) => provider.instance_status === "online").length, [providers]);
  const approvedProviders = useMemo(() => providers.filter((provider) => provider.approval_status === "approved").length, [providers]);

  return (
    <div className="stack">
      <section className="card stack" style={{ padding: 32 }}>
        <div className="split-panel">
          <div className="stack">
            <span className="eyebrow">Node</span>
            <h1>Node oluştur, komutu çalıştır.</h1>
            <p className="muted" style={{ maxWidth: 620 }}>Önce node oluştur. Anahtarı bir kez kopyala. Komutu çalıştır. Sonra durumu burada gör.</p>
            <div className="row">
              <button className="button" type="button" onClick={() => setShowCreate(true)}>Node oluştur</button>
              <a className="button secondary" href="#node-status">Durumu gör</a>
            </div>
          </div>
          <div className="grid stat-strip">
            <div className="metric"><strong>{providers.length}</strong><span className="muted">Toplam node</span></div>
            <div className="metric"><strong>{onlineProviders}</strong><span className="muted">Çevrimiçi</span></div>
            <div className="metric"><strong>{approvedProviders}</strong><span className="muted">Onaylı</span></div>
          </div>
        </div>
      </section>

      <section className="split-panel">
        <div className="card stack">
          <div className="surface-head">
            <div>
              <h2>Kısa sıra</h2>
              <p className="muted">İlk kurulum için gerekenler.</p>
            </div>
          </div>
          <ol className="checklist">
            <li><strong>Node oluştur</strong><span className="muted">Adını ver.</span></li>
            <li><strong>Anahtarı kopyala</strong><span className="muted">Bir kez görünür.</span></li>
            <li><strong>Komutu çalıştır</strong><span className="muted">Bağlantıyı aç.</span></li>
            <li><strong>Durumu kontrol et</strong><span className="muted">Bağlı mı, onay bekliyor mu, hazır mı gör.</span></li>
          </ol>
        </div>
        <div className="stack">
          <CreditNotice />
          <PrivacyNotice />
        </div>
      </section>

      {error ? <ErrorMessage error={error} hint="Node bilgileri alınamadı. Sayfayı yenileyip tekrar dene." /> : null}
      {success ? <SuccessMessage message={success} hint="Sıradaki iş: anahtarı kopyala, komutu çalıştır, sonra bu sayfaya dön." /> : null}
      {loading ? <Loading label="Node'lar yükleniyor..." hint="Bağlantı ve onay durumu hazırlanıyor." /> : null}

      {!loading && providers.length === 0 && !showCreate ? (
        <div className="card stack">
          <Empty label="Henüz node yok." hint="Hazırsan bir node oluştur. Sonra komutu çalıştır." />
          <div className="row">
            <button className="button" type="button" onClick={() => setShowCreate(true)}>Node oluştur</button>
          </div>
        </div>
      ) : null}

      {showCreate || providers.length > 0 ? (
        <>
          {showCreate ? (
            <form className="card stack" onSubmit={submit}>
              <h2>Yeni node</h2>
              <div className="field">
                <label htmlFor="node-name">Node adı</label>
                <input id="node-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn: Ev Bilgisayarı" />
              </div>
              <button className="button" disabled={saving} type="submit">{saving ? "Oluşturuluyor..." : "Node oluştur"}</button>
            </form>
          ) : (
            <div className="row">
              <button className="button secondary" type="button" onClick={() => setShowCreate(true)}>Yeni node</button>
            </div>
          )}

          {token ? (
            <section className="notice warn stack">
              <strong>Bu anahtarı şimdi kopyala. Bir daha görünmez.</strong>
              <CopyBox value={token} />
              <div className="card stack">
                <strong>Kurulum komutu</strong>
                <CopyBox value={commands} />
                <div className="muted">Komutu çalıştır. Sonra bu sayfaya dönüp durumu kontrol et.</div>
              </div>
            </section>
          ) : null}

          {providers.length > 0 ? (
            <section id="node-status" className="card stack">
              <div className="surface-head">
                <div>
                  <h2>Node durumu</h2>
                  <p className="muted">Yeni node'lar üstte görünür.</p>
                </div>
              </div>
              <div className="stack">
                {providers.map((provider) => <NodeCard key={provider.id} provider={provider} />)}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
