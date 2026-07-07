"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { listAdminJobs, type AdminJob } from "@/lib/api";

export default function AdminJobsPage() {
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
        <h1>Admin Jobs</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading /> : null}
        {!loading && jobs.length === 0 ? <Empty label="No jobs." /> : null}
        {jobs.length > 0 ? (
          <div className="surface">
            <table>
              <thead><tr><th>Job</th><th>User / Project</th><th>Model</th><th>Status</th><th>Credits</th><th>Error</th><th>Created</th></tr></thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.id}<div className="muted">{job.request_id}</div></td>
                    <td>{job.user_id}<div className="muted">{job.project_id}</div></td>
                    <td>{job.model_slug}</td>
                    <td><StatusPill value={job.status} /></td>
                    <td>reserved {job.reserved_credits}<div className="muted">actual {job.actual_cost_credits} / provider {job.provider_reward_credits}</div></td>
                    <td>{job.error_code || "—"}<div className="muted">{job.error_message || ""}</div></td>
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
