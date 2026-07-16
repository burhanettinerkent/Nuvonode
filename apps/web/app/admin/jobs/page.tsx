"use client";

import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { listAdminJobs, type AdminJob } from "@/lib/api";
import { useEffect, useState } from "react";

export default function AdminRequestsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAdminJobs()
      .then((res) => setJobs(res.jobs))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="stack">
        <h1>İstekler</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading label="İstekler yükleniyor..." /> : null}
        {!loading && jobs.length === 0 ? <Empty label="Henüz istek yok." /> : null}
        {jobs.length > 0 ? (
          <>
            <div className="surface desktop-only">
              <table>
                <thead><tr><th>İstek</th><th>Kullanıcı</th><th>Model</th><th>Durum</th><th>Kredi</th><th>Hata</th><th>Tarih</th></tr></thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="muted">İstek kimliği yönetim kayıtlarında tutulur</td>
                      <td className="muted">Kullanıcı kimliği yönetim kayıtlarında tutulur</td>
                      <td>{job.model_slug}</td>
                      <td><StatusPill value={job.status} /></td>
                      <td>{job.actual_cost_credits} <span className="muted">/ node {job.provider_reward_credits}</span></td>
                      <td>{job.error_code || "—"}</td>
                      <td>{new Date(job.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-only mobile-list">
              {jobs.map((job) => (
                <div key={job.id} className="mobile-item">
                  <div className="row">
                    <strong>{job.model_slug}</strong>
                    <StatusPill value={job.status} />
                  </div>
                  <div className="meta muted">
                    <div>İstek kimliği yönetim kayıtlarında tutulur</div>
                    <div>Kullanıcı kimliği yönetim kayıtlarında tutulur</div>
                    <div>Hata {job.error_code || "—"}</div>
                    <div>{new Date(job.created_at).toLocaleString()}</div>
                  </div>
                  <div className="row">
                    <span>Kredi {job.actual_cost_credits}</span>
                    <span className="muted">node {job.provider_reward_credits}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </Shell>
  );
}
