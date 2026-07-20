"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { listModels, type Model } from "@/lib/api";

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listModels()
      .then((res) => setModels(res.models))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stack">
      <section className="card stack" style={{ padding: 32 }}>
        <div className="split-panel">
          <div className="stack">
            <span className="eyebrow">Modeller</span>
            <h1>İlk isteğin için model seç.</h1>
            <p className="muted" style={{ maxWidth: 620 }}>API adı, kısa açıklama ve temel kredi bilgisi burada görünür.</p>
            <div className="row">
              <Link className="button" href="/dashboard/api-keys">API'ye dön</Link>
              <Link className="button secondary" href="/dashboard/usage">İstekleri gör</Link>
            </div>
          </div>
          <div className="card stack secondary-card" style={{ padding: 22 }}>
            <h2>Ne lazım?</h2>
            <ul className="checklist">
              <li><strong>API adı</strong><span className="muted">İstekte bu adı kullan.</span></li>
              <li><strong>Kısa açıklama</strong><span className="muted">Hızlıca seçim yap.</span></li>
              <li><strong>Kredi bilgisi</strong><span className="muted">Tahmini maliyeti gör.</span></li>
            </ul>
          </div>
        </div>
      </section>

      {error ? <ErrorMessage error={error} hint="Model listesi alınamadı. Biraz sonra tekrar dene." /> : null}
      {loading ? <Loading label="Modeller yükleniyor..." hint="Kullanılabilir modeller hazırlanıyor." /> : null}
      {!loading && models.length === 0 ? <Empty label="Şu anda kullanılabilir model görünmüyor." hint="Biraz sonra tekrar kontrol et." /> : null}
      {models.length > 0 ? (
        <section className="grid summary-grid">
          {models.map((model) => (
            <div key={model.id} className="card stack">
              <div className="surface-head">
                <div>
                  <h2>{model.display_name}</h2>
                  <p className="muted">API adı: {model.slug}</p>
                </div>
                {model.status !== "active" ? <StatusPill value={model.status} /> : null}
              </div>
              <p className="muted">{model.description}</p>
              <div className="row">
                <span className="pill">Giriş {model.input_credit_per_1k}</span>
                <span className="pill">Çıkış {model.output_credit_per_1k}</span>
              </div>
              <div className="stack muted">
                <div>Bağlam: {model.context_length}</div>
                <div>{model.community_allowed ? "Topluluk node'larında çalışabilir." : "Sadece onaylı node'larda çalışır."}</div>
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
