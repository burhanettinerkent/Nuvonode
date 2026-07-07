"use client";

import { Shell } from "@/components/Shell";

export default function AdminAuditLogPage() {
  return (
    <Shell>
      <div className="stack">
        <h1>Audit Log</h1>
        <div className="notice">Audit log data is written by admin actions, but a dashboard read endpoint is not implemented yet. No fake audit data is shown.</div>
      </div>
    </Shell>
  );
}
