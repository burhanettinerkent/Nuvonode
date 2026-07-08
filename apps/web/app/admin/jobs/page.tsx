"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { listAdminJobs, type AdminJob } from "@/lib/api";

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
        {loading ? <Loading /> : null}
        {!loading && jobs.length === 0 ? <Empty label="İstek yok." /> : null}
        {jobs.length > 0 ? (
          <div className="surface">
            <table>
              <thead><tr><th>İstek</th><th>Kullanıcı</th><th>Model</th><th>Durum</th><th>Kredi</th><th>Hata</th><th>Tarih</th></tr></thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="muted">{job.id}</td>
                    <td className="muted">{job.user_id}</td>
                    <td>{job.model_slug}</td>
                    <td><StatusPill value={job.status} /></td>
                    <td>{job.actual_cost_credits} <span className="muted">/ {job.provider_reward_credits}</span></td>
                    <td>{job.error_code || "—"}</td>
                    <td>{new Date(job.created_at).toLocaleString()}</td>
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
