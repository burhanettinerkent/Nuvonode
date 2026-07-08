"use client";

import { FormEvent, useEffect, useState } from "react";
import { CopyBox } from "@/components/CopyBox";
import { CreditNotice } from "@/components/CreditNotice";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading, SuccessMessage } from "@/components/State";
import { createProvider, listProviders, type Provider } from "@/lib/api";

function NodeCard({ provider }: { provider: Provider }) {
  if (provider.instance_status === "online" && provider.model_names?.length > 0) {
    return (
      <div className="card stack">
        <div className="row">
          <strong>{provider.name}</strong>
          <StatusPill value={provider.instance_status} />
        </div>
        <div className="muted">
          {provider.model_names.join(", ")}
        </div>
        <div className="row">
          <span className="muted">Son sinyal: {provider.last_heartbeat_at ? new Date(provider.last_heartbeat_at).toLocaleString() : "—"}</span>
          <span className="muted">Onay: <StatusPill value={provider.approval_status} /></span>
        </div>
        <CreditNotice />
        <PrivacyNotice />
      </div>
    );
  }

  if (provider.instance_status === "online") {
    return (
      <div className="card stack">
        <div className="row">
          <strong>{provider.name}</strong>
          <StatusPill value={provider.instance_status} />
        </div>
        <div className="muted">Node çevrimiçi. Modellerin onayı bekleniyor.</div>
      </div>
    );
  }

  if (provider.token_prefix) {
    return (
      <div className="card stack">
        <div className="row">
          <strong>{provider.name}</strong>
          <span className="pill warn">Bağlı değil</span>
        </div>
        <div className="muted">Node çalıştırmak için komutu çalıştır:</div>
        <pre>cd apps/provider-node && go run ./cmd/provider-node serve</pre>
      </div>
    );
  }

  return null;
}

export default function NodesPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [setupCommands, setSetupCommands] = useState("");
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
    setSetupCommands("");
    try {
      const res = await createProvider(name, null, false);
      setProviders((items) => [{ ...res.provider, instance_status: null, last_heartbeat_at: null, model_names: [] }, ...items]);
      setToken(res.plaintext_token);
      setSetupCommands(`cd C:\\Users\\Kate Braun\\Documents\\Nuvonode\\apps\\provider-node\ngo run .\\cmd\\provider-node init --server http://localhost:18080 --token ${res.plaintext_token} --name "${name}"\ngo run .\\cmd\\provider-node doctor\ngo run .\\cmd\\provider-node serve`);
      setName("");
      setSuccess("Node oluşturuldu. Node anahtarını kopyala ve komutu çalıştır.");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <div className="stack">
        <h1>Node'larım</h1>

        {error ? <ErrorMessage error={error} /> : null}
        {success ? <SuccessMessage message={success} /> : null}
        {loading ? <Loading /> : null}

        {!loading && providers.length === 0 && !showCreate ? (
          <div className="card stack">
            <h2>Henüz node'un yok</h2>
            <p className="muted">Node çalıştırarak kredi kazanmaya başla. Kendi bilgisayarını bağla, Ollama modellerini sisteme ekle.</p>
            <button className="button" type="button" onClick={() => setShowCreate(true)}>Node oluştur</button>
          </div>
        ) : null}

        {showCreate || providers.length > 0 ? (
          <>
            {providers.length === 0 ? null : (
              <div className="stack">
                {providers.map((provider) => <NodeCard key={provider.id} provider={provider} />)}
              </div>
            )}

            {!showCreate ? (
              <button className="button secondary" type="button" onClick={() => setShowCreate(true)}>Yeni node oluştur</button>
            ) : (
              <form className="card stack" onSubmit={submit}>
                <h2>Node oluştur</h2>
                <div className="field">
                  <label htmlFor="node-name">Node adı</label>
                  <input id="node-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn: Ev Bilgisayarı" />
                </div>
                <button className="button" disabled={saving} type="submit">{saving ? "Oluşturuluyor..." : "Node oluştur"}</button>
              </form>
            )}

            {token ? (
              <div className="notice warn stack">
                <strong>Node anahtarını kopyala. Bir daha gösterilmez.</strong>
                <CopyBox value={token} />
                <div className="card stack">
                  <strong>Kurulum komutu:</strong>
                  <CopyBox value={setupCommands} />
                  <div className="muted">Kazandığın krediler bakiyene eklenir ve API isteklerinde kullanılabilir.</div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </Shell>
  );
}
