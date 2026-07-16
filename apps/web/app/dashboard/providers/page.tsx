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
          <StatusPill value={provider.approval_status} />
        </div>
        <div className="muted">Node bağlı ve istek almaya hazır görünüyor.</div>
        <div>
          <strong>Modeller</strong>
          <div className="muted">{provider.model_names.join(", ")}</div>
        </div>
        <div className="muted">Son sinyal: {provider.last_heartbeat_at ? new Date(provider.last_heartbeat_at).toLocaleString() : "—"}</div>
      </div>
    );
  }

  if (provider.instance_status === "online") {
    return (
      <div className="card stack">
        <div className="row">
          <strong>{provider.name}</strong>
          <StatusPill value={provider.instance_status} />
          <StatusPill value={provider.approval_status} />
        </div>
        <div className="muted">Node bağlı. Model onayı tamamlanınca burada istek almaya hazır olduğunu görürsün.</div>
        <div className="muted">Son sinyal: {provider.last_heartbeat_at ? new Date(provider.last_heartbeat_at).toLocaleString() : "—"}</div>
      </div>
    );
  }

  if (provider.token_prefix) {
    return (
      <div className="card stack">
        <div className="row">
          <strong>{provider.name}</strong>
          <span className="pill warn">Bağlı değil</span>
          <StatusPill value={provider.approval_status} />
        </div>
        <div className="muted">Node şu anda bağlı değil. Daha önce kaydettiğin yapılandırma ile aşağıdaki komutu çalıştır.</div>
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
      setSetupCommands(`cd apps/provider-node\ngo run ./cmd/provider-node init --server http://localhost:18080 --token ${res.plaintext_token} --name "${name}"\ngo run ./cmd/provider-node doctor\ngo run ./cmd/provider-node serve`);
      setName("");
      setSuccess("Node oluşturuldu. Anahtarı kopyala, komutu çalıştır ve ardından durumu bu sayfada gör.");
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
          <h1>Node'larım</h1>
          <p className="muted">Node çalıştır → kredi kazan → aynı krediyi API kullanımında harca. Bu sayfa node oluşturmayı, bağlamayı ve durumunu takip etmeyi kolaylaştırır.</p>
        </div>

        {providers.length > 0 ? (
          <div className="grid">
            <CreditNotice />
            <PrivacyNotice />
          </div>
        ) : null}

        {error ? <ErrorMessage error={error} /> : null}
        {success ? <SuccessMessage message={success} /> : null}
        {loading ? <Loading label="Node durumu hazırlanıyor..." /> : null}

        {!loading && providers.length === 0 && !showCreate ? (
          <div className="card stack">
            <h2>Henüz node'un yok</h2>
            <p className="muted">Başlamak için önce bir node oluştur. Sonra node anahtarını kopyala, tek komutu çalıştır ve bağlantıyı burada gör.</p>
            <ol className="checklist">
              <li>
                <div>
                  <strong>1. Node oluştur</strong>
                  <div className="muted">Bu sayfada adını verip anahtarını al.</div>
                </div>
              </li>
              <li>
                <div>
                  <strong>2. Komutu çalıştır</strong>
                  <div className="muted">Ollama kontrolünden sonra node bağlantısı açılır.</div>
                </div>
              </li>
              <li>
                <div>
                  <strong>3. Durumu burada izle</strong>
                  <div className="muted">Bağlı, onay bekliyor veya hazır bilgisini aynı yerde görürsün.</div>
                </div>
              </li>
            </ol>
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
                <h2>1. Node oluştur</h2>
                <div className="field">
                  <label htmlFor="node-name">Node adı</label>
                  <input id="node-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn: Ev Bilgisayarı" />
                </div>
                <button className="button" disabled={saving} type="submit">{saving ? "Oluşturuluyor..." : "Node oluştur"}</button>
              </form>
            )}

            {token ? (
              <div className="notice warn stack">
                <strong>2. Node anahtarını şimdi kopyala. Bir daha gösterilmez.</strong>
                <CopyBox value={token} />
                <div className="card stack">
                  <strong>3. Bu komutu çalıştır</strong>
                  <CopyBox value={setupCommands} />
                  <div className="muted">Komutu çalıştırdıktan sonra bu sayfaya dön. Node bağlı olduğunda durum kartında hemen görürsün.</div>
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
