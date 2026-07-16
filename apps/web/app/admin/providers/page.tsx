"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading, SuccessMessage } from "@/components/State";
import { approveProvider, disableProvider, listAdminProviders, listPendingProviderModels, approveProviderModel, rejectProviderModel, rejectProvider, type Provider, type ProviderModelAdvertisement } from "@/lib/api";

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
      .then(([provRes, adRes]) => { setProviders(provRes.providers); setAds(adRes.provider_model_advertisements); })
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const hasPendingNodes = providers.filter((p) => p.approval_status === "pending").length > 0;
  const hasPendingModels = ads.length > 0;

  return (
    <Shell>
      <div className="stack">
        <h1>İnceleme</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {success ? <SuccessMessage message={success} /> : null}
        {loading ? <Loading label="İnceleme kuyruğu hazırlanıyor..." /> : null}

        {!loading ? (
          <>
            <div className="row">
              <button className={`button ${tab === "nodes" ? "" : "secondary"}`} onClick={() => setTab("nodes")}>
                Node'lar {hasPendingNodes ? <span className="pill warn">bekleyen</span> : null}
              </button>
              <button className={`button ${tab === "models" ? "" : "secondary"}`} onClick={() => setTab("models")}>
                Model onayları {hasPendingModels ? <span className="pill warn">bekleyen</span> : null}
              </button>
            </div>

            {tab === "nodes" ? (
              providers.length === 0 ? <Empty label="Henüz incelenecek node yok." /> : (
                <div className="surface">
                  <table>
                    <thead><tr><th>Node</th><th>Onay</th><th>Durum</th><th>Bölge</th><th>Oluşturulma</th><th>İşlem</th></tr></thead>
                    <tbody>
                      {providers.map((provider) => (
                        <tr key={provider.id}>
                          <td>{provider.name}<div className="muted">Kimlik yönetim tarafında saklı</div></td>
                          <td><StatusPill value={provider.approval_status} /></td>
                          <td><StatusPill value={provider.status} /></td>
                          <td>{provider.region_hint || "—"}</td>
                          <td>{new Date(provider.created_at).toLocaleString()}</td>
                          <td className="row">
                            {provider.approval_status !== "approved" ? <button className="button" onClick={() => approveProvider(provider.id).then(load).catch(setError)}>Onayla</button> : null}
                            {provider.approval_status !== "rejected" ? <button className="button secondary" onClick={() => { if (confirm("Reddet?")) rejectProvider(provider.id).then(load).catch(setError); }}>Reddet</button> : null}
                            {provider.status !== "disabled" ? <button className="button danger" onClick={() => { if (confirm("Devre dışı?")) disableProvider(provider.id).then(load).catch(setError); }}>Devre dışı</button> : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : null}

            {tab === "models" ? (
              ads.length === 0 ? <Empty label="Bekleyen model onayı yok." /> : (
                <div className="surface">
                  <table>
                    <thead><tr><th>Model</th><th>Node</th><th>Çalışma ortamı</th><th>İşlem</th></tr></thead>
                    <tbody>
                      {ads.map((ad) => (
                        <tr key={ad.id}>
                          <td>{ad.runtime_model_name}</td>
                          <td className="muted">Node kaydı yönetim tarafında tutulur</td>
                          <td>{ad.runtime}</td>
                          <td className="row">
                            <button className="button" onClick={() => approveProviderModel(ad.id).then(load).catch(setError)}>Onayla</button>
                            <button className="button secondary" onClick={() => { if (confirm("Reddet?")) rejectProviderModel(ad.id).then(load).catch(setError); }}>Reddet</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : null}
          </>
        ) : null}
      </div>
    </Shell>
  );
}
