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
        <h1>Audit Log</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading /> : null}
        {!loading && entries.length === 0 ? <Empty label="No audit log entries yet." /> : null}
        {entries.length > 0 ? (
          <div className="surface">
            <table>
              <thead><tr><th>Action</th><th>Actor</th><th>Target</th><th>Target ID</th><th>Created</th></tr></thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td><StatusPill value={entry.action} /></td>
                    <td className="muted">{entry.actor_user_id}</td>
                    <td>{entry.target_type || "—"}</td>
                    <td className="muted">{entry.target_id || "—"}</td>
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
