"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
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
    <Shell>
      <div className="stack">
        <h1>Bekleyen model onayları</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {success ? <SuccessMessage message={success} /> : null}
        {loading ? <Loading label="Bekleyen modeller yükleniyor..." /> : null}
        {!loading && ads.length === 0 ? <Empty label="Bekleyen model onayı yok." /> : null}
        {ads.length > 0 ? (
          <div className="surface">
            <table>
              <thead><tr><th>Çalışan model</th><th>Node</th><th>Ortam</th><th>Özet</th><th>Durum</th><th>Tarih</th><th>İşlem</th></tr></thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id}>
                    <td>{ad.runtime_model_name}</td>
                    <td className="muted">{ad.provider_id}</td>
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
        ) : null}
      </div>
    </Shell>
  );
}
