"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Empty, ErrorMessage, Loading, SuccessMessage } from "@/components/State";
import { approveProviderModel, listPendingProviderModels, rejectProviderModel, type ProviderModelAdvertisement } from "@/lib/api";

export default function AdminProviderModelsPage() {
  const [ads, setAds] = useState<ProviderModelAdvertisement[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    listPendingProviderModels()
      .then((res) => setAds(res.provider_model_advertisements))
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function act(id: string, action: "approve" | "reject") {
    if (action === "reject" && !confirm("Bu modeli reddetmek istiyor musun?")) return;
    setError(null);
    setSuccess("");
    try {
      if (action === "approve") await approveProviderModel(id);
      if (action === "reject") await rejectProviderModel(id);
      setAds((items) => items.filter((item) => item.id !== id));
      setSuccess(action === "approve" ? "Model onaylandı." : "Model reddedildi.");
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="stack">
      <section className="card stack split-panel" style={{ padding: 32 }}>
        <div className="stack">
          <span className="eyebrow">Model kuyruğu</span>
          <h1>Bekleyen model ilanlarını kapat.</h1>
          <p className="muted" style={{ maxWidth: 620 }}>Bu sayfa yalnızca bekleyen model ilanlarına odaklanır.</p>
          <div className="row">
            <Link className="button secondary" href="/admin/providers">Ana kuyruğa dön</Link>
          </div>
        </div>
        <div className="grid stat-strip">
          <div className="metric"><strong>{ads.length}</strong><span className="muted">Bekleyen model</span></div>
        </div>
      </section>

      {error ? <ErrorMessage error={error} hint="Model kuyruğu alınamadı. Sayfayı yenileyip tekrar dene." /> : null}
      {success ? <SuccessMessage message={success} /> : null}
      {loading ? <Loading label="Bekleyen modeller yükleniyor..." hint="İnceleme listesi hazırlanıyor." /> : null}
      {!loading && ads.length === 0 ? <Empty label="Bekleyen model onayı yok." hint="Yeni ilan gelirse burada görünür." /> : null}

      {ads.length > 0 ? (
        <section className="card stack">
          <div className="surface-head">
            <div>
              <h2>Model ilanları</h2>
              <p className="muted">Model adı, node ve çalışma ortamı birlikte görünür.</p>
            </div>
          </div>
          <div className="surface desktop-only">
            <table>
              <thead><tr><th>Model</th><th>Node</th><th>Ortam</th><th>Özet</th><th>Durum</th><th>Tarih</th><th>İşlem</th></tr></thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id}>
                    <td><strong>{ad.runtime_model_name}</strong><div className="muted">id {ad.id}</div></td>
                    <td className="muted">node {ad.provider_id}</td>
                    <td>{ad.runtime}</td>
                    <td>{ad.local_digest || "—"}</td>
                    <td><StatusPill value={ad.status} /></td>
                    <td>{new Date(ad.created_at).toLocaleString()}</td>
                    <td className="row">
                      <button className="button" type="button" onClick={() => act(ad.id, "approve")}>Onayla</button>
                      <button className="button secondary" type="button" onClick={() => act(ad.id, "reject")}>Reddet</button>
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
                  <div>digest {ad.local_digest || "—"}</div>
                  <div>{new Date(ad.created_at).toLocaleString()}</div>
                  <div>id {ad.id}</div>
                </div>
                <div className="row">
                  <button className="button" type="button" onClick={() => act(ad.id, "approve")}>Onayla</button>
                  <button className="button secondary" type="button" onClick={() => act(ad.id, "reject")}>Reddet</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
