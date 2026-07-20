"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { listAdminAuditLog, type AdminAuditLogEntry } from "@/lib/api";

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<AdminAuditLogEntry[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAdminAuditLog()
      .then((res) => setEntries(res.audit_log))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stack">
      <section className="card stack split-panel" style={{ padding: 32 }}>
        <div className="stack">
          <span className="eyebrow">Denetim</span>
          <h1>Yönetim hareketlerini gör.</h1>
          <p className="muted" style={{ maxWidth: 620 }}>Onay, red, model değişikliği ve kredi düzeltmeleri burada görünür.</p>
        </div>
        <div className="grid stat-strip">
          <div className="metric"><strong>{entries.length}</strong><span className="muted">Toplam kayıt</span></div>
        </div>
      </section>

      {error ? <ErrorMessage error={error} hint="Denetim kayıtları alınamadı. Sayfayı yenileyip tekrar dene." /> : null}
      {loading ? <Loading label="Denetim kayıtları yükleniyor..." hint="Son yönetim hareketleri hazırlanıyor." /> : null}
      {!loading && entries.length === 0 ? <Empty label="Henüz denetim kaydı yok." hint="İlk yönetim işleminden sonra burada görünür." /> : null}

      {entries.length > 0 ? (
        <section className="card stack">
          <div className="surface-head">
            <div>
              <h2>Yönetim hareketleri</h2>
              <p className="muted">İşlem, yapan kişi, hedef ve zaman birlikte görünür.</p>
            </div>
          </div>
          <div className="surface desktop-only">
            <table>
              <thead><tr><th>İşlem</th><th>Yapan</th><th>Hedef türü</th><th>Hedef</th><th>Tarih</th></tr></thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td><StatusPill value={entry.action} /></td>
                    <td><strong>{entry.actor_user_id}</strong><div className="muted">kayıt {entry.id}</div></td>
                    <td>{entry.target_type || "—"}</td>
                    <td>{entry.target_id || "—"}</td>
                    <td>{new Date(entry.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-only mobile-list">
            {entries.map((entry) => (
              <div key={entry.id} className="mobile-item">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <StatusPill value={entry.action} />
                  <span className="muted">{new Date(entry.created_at).toLocaleString()}</span>
                </div>
                <div className="meta muted">
                  <div>actor {entry.actor_user_id}</div>
                  <div>hedef türü {entry.target_type || "—"}</div>
                  <div>hedef {entry.target_id || "—"}</div>
                  <div>kayıt {entry.id}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
