"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
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
    <Shell>
      <div className="stack">
        <h1>Denetim</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading label="Denetim kayıtları yükleniyor..." /> : null}
        {!loading && entries.length === 0 ? <Empty label="Henüz denetim kaydı yok." /> : null}
        {entries.length > 0 ? (
          <div className="surface">
            <table>
              <thead><tr><th>İşlem</th><th>Yapan</th><th>Hedef tür</th><th>Hedef</th><th>Tarih</th></tr></thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td><StatusPill value={entry.action} /></td>
                    <td className="muted">Yönetici hesabı</td>
                    <td>{entry.target_type || "—"}</td>
                    <td className="muted">Kimlik yönetim kayıtlarında tutulur</td>
                    <td>{new Date(entry.created_at).toLocaleString()}</td>
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
