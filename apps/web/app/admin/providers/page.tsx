"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Empty, ErrorMessage, Loading, SuccessMessage } from "@/components/State";
import { approveProvider, approveProviderModel, disableProvider, listAdminProviders, listPendingProviderModels, rejectProvider, rejectProviderModel, type Provider, type ProviderModelAdvertisement } from "@/lib/api";

export default function AdminReviewPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [ads, setAds] = useState<ProviderModelAdvertisement[]>([]);
  const [tab, setTab] = useState<"nodes" | "models">("nodes");
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([listAdminProviders(), listPendingProviderModels()])
      .then(([provRes, adRes]) => {
        setProviders(provRes.providers);
        setAds(adRes.provider_model_advertisements);
        if (provRes.providers.filter((provider) => provider.approval_status === "pending").length === 0 && adRes.provider_model_advertisements.length > 0) {
          setTab("models");
        }
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const pendingProviders = useMemo(() => providers.filter((provider) => provider.approval_status === "pending"), [providers]);
  const sortedProviders = useMemo(() => {
    const pending = providers.filter((provider) => provider.approval_status === "pending");
    const rest = providers.filter((provider) => provider.approval_status !== "pending");
    return [...pending, ...rest];
  }, [providers]);
  const hasPendingNodes = pendingProviders.length > 0;
  const hasPendingModels = ads.length > 0;

  async function actOnProvider(providerID: string, action: "approve" | "reject" | "disable") {
    setError(null);
    setSuccess("");
    try {
      if (action === "approve") await approveProvider(providerID);
      if (action === "reject") {
        if (!confirm("Bu node'u reddetmek istiyor musun?")) return;
        await rejectProvider(providerID);
      }
      if (action === "disable") {
        if (!confirm("Bu node'u devre dışı bırakmak istiyor musun?")) return;
        await disableProvider(providerID);
      }
      setSuccess(action === "approve" ? "Node onaylandı." : action === "reject" ? "Node reddedildi." : "Node devre dışı bırakıldı.");
      load();
    } catch (err) {
      setError(err);
    }
  }

  async function actOnModel(id: string, action: "approve" | "reject") {
    setError(null);
    setSuccess("");
    try {
      if (action === "approve") await approveProviderModel(id);
      if (action === "reject") {
        if (!confirm("Bu modeli reddetmek istiyor musun?")) return;
        await rejectProviderModel(id);
      }
      setSuccess(action === "approve" ? "Model onaylandı." : "Model reddedildi.");
      load();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="stack">
      <section className="card stack" style={{ padding: 32 }}>
        <div className="split-panel">
          <div className="stack">
            <span className="eyebrow">İnceleme</span>
            <h1>Bekleyen işleri hızlıca temizle.</h1>
            <p className="muted" style={{ maxWidth: 620 }}>Önce bekleyen node'ları ve modelleri kapat. Sonra istek ekranına geç.</p>
            <div className="row">
              <button className={`button ${tab === "nodes" ? "" : "secondary"}`} type="button" onClick={() => setTab("nodes")}>Node kuyruğu {hasPendingNodes ? `(${pendingProviders.length})` : ""}</button>
              <button className={`button ${tab === "models" ? "" : "secondary"}`} type="button" onClick={() => setTab("models")}>Model kuyruğu {hasPendingModels ? `(${ads.length})` : ""}</button>
            </div>
          </div>
          <div className="grid stat-strip">
            <div className="metric"><strong>{pendingProviders.length}</strong><span className="muted">Bekleyen node</span></div>
            <div className="metric"><strong>{ads.length}</strong><span className="muted">Bekleyen model</span></div>
            <div className="metric"><strong>{providers.length}</strong><span className="muted">Toplam node</span></div>
          </div>
        </div>
      </section>

      {error ? <ErrorMessage error={error} hint="İnceleme verileri alınamadı. Sayfayı yenileyip tekrar dene." /> : null}
      {success ? <SuccessMessage message={success} /> : null}
      {loading ? <Loading label="İnceleme kuyruğu hazırlanıyor..." hint="Node ve model listeleri yükleniyor." /> : null}

      {!loading ? (
        <>
          {tab === "nodes" ? (
            sortedProviders.length === 0 ? <Empty label="İncelenecek node yok." hint="Yeni node gelince burada görünür." /> : (
              <section className="card stack">
                {!hasPendingNodes ? (
                  <div className="notice">
                    Node kuyruğu temiz. İstersen model kuyruğuna veya istek ekranına geç.
                  </div>
                ) : null}
                <div className="surface desktop-only">
                  <table>
                    <thead><tr><th>Node</th><th>Onay</th><th>Durum</th><th>Bölge</th><th>Oluşturulma</th><th>İşlem</th></tr></thead>
                    <tbody>
                      {sortedProviders.map((provider) => (
                        <tr key={provider.id}>
                          <td>
                            <strong>{provider.name}</strong>
                            <div className="muted">id {provider.id}</div>
                          </td>
                          <td><StatusPill value={provider.approval_status} /></td>
                          <td><StatusPill value={provider.status} /></td>
                          <td>{provider.region_hint || "—"}</td>
                          <td>{new Date(provider.created_at).toLocaleString()}</td>
                          <td className="row">
                            {provider.approval_status !== "approved" ? <button className="button" type="button" onClick={() => actOnProvider(provider.id, "approve")}>Onayla</button> : null}
                            {provider.approval_status !== "rejected" ? <button className="button secondary" type="button" onClick={() => actOnProvider(provider.id, "reject")}>Reddet</button> : null}
                            {provider.status !== "disabled" ? <button className="button danger" type="button" onClick={() => actOnProvider(provider.id, "disable")}>Devre dışı</button> : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mobile-only mobile-list">
                  {sortedProviders.map((provider) => (
                    <div key={provider.id} className="mobile-item">
                      <div className="row">
                        <strong>{provider.name}</strong>
                        <StatusPill value={provider.approval_status} />
                        <StatusPill value={provider.status} />
                      </div>
                      <div className="meta muted">
                        <div>bölge {provider.region_hint || "—"}</div>
                        <div>{new Date(provider.created_at).toLocaleString()}</div>
                        <div>id {provider.id}</div>
                      </div>
                      <div className="row">
                        {provider.approval_status !== "approved" ? <button className="button" type="button" onClick={() => actOnProvider(provider.id, "approve")}>Onayla</button> : null}
                        {provider.approval_status !== "rejected" ? <button className="button secondary" type="button" onClick={() => actOnProvider(provider.id, "reject")}>Reddet</button> : null}
                        {provider.status !== "disabled" ? <button className="button danger" type="button" onClick={() => actOnProvider(provider.id, "disable")}>Devre dışı</button> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          ) : null}

          {tab === "models" ? (
            ads.length === 0 ? (
              <div className="card stack">
                <Empty label="Bekleyen model onayı yok." hint="Yeni model ilanı gelirse burada görünür." />
                <div className="row">
                  <Link className="button secondary" href="/admin/jobs">İstekleri aç</Link>
                </div>
              </div>
            ) : (
              <section className="card stack">
                <div className="surface desktop-only">
                  <table>
                    <thead><tr><th>Model</th><th>Node</th><th>Ortam</th><th>Durum</th><th>İşlem</th></tr></thead>
                    <tbody>
                      {ads.map((ad) => (
                        <tr key={ad.id}>
                          <td>
                            <strong>{ad.runtime_model_name}</strong>
                            <div className="muted">id {ad.id}</div>
                          </td>
                          <td className="muted">node {ad.provider_id}</td>
                          <td>{ad.runtime}</td>
                          <td><StatusPill value={ad.status} /></td>
                          <td className="row">
                            <button className="button" type="button" onClick={() => actOnModel(ad.id, "approve")}>Onayla</button>
                            <button className="button secondary" type="button" onClick={() => actOnModel(ad.id, "reject")}>Reddet</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mobile-only mobile-list">
                  {ads.map((ad) => (
                    <div key={ad.id} className="mobile-item">
                      <div className="row">
                        <strong>{ad.runtime_model_name}</strong>
                        <StatusPill value={ad.status} />
                      </div>
                      <div className="meta muted">
                        <div>node {ad.provider_id}</div>
                        <div>runtime {ad.runtime}</div>
                        <div>id {ad.id}</div>
                      </div>
                      <div className="row">
                        <button className="button" type="button" onClick={() => actOnModel(ad.id, "approve")}>Onayla</button>
                        <button className="button secondary" type="button" onClick={() => actOnModel(ad.id, "reject")}>Reddet</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          ) : null}
        </>
      ) : null}
    </div>
  );
}
