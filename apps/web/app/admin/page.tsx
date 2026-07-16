"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { ErrorMessage, Loading } from "@/components/State";
import { listAdminJobs, listAdminModels, listAdminProviders, listAdminUsage, type AdminJob, type AdminUsageRecord, type Model, type Provider } from "@/lib/api";

export default function AdminPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [usage, setUsage] = useState<AdminUsageRecord[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listAdminProviders(), listAdminModels(), listAdminJobs(), listAdminUsage()])
      .then(([providerRes, modelRes, jobRes, usageRes]) => {
        setProviders(providerRes.providers);
        setModels(modelRes.models);
        setJobs(jobRes.jobs);
        setUsage(usageRes.usage);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="stack">
        <h1>Yönetim</h1>
        {loading ? <Loading label="Yönetim özeti hazırlanıyor..." /> : null}
        {error ? <ErrorMessage error={error} /> : null}
        {!loading && !error ? (
          <div className="grid">
            <div className="panel"><div className="muted">Node'lar</div><h2>{providers.length}</h2></div>
            <div className="panel"><div className="muted">Bekleyen node'lar</div><h2>{providers.filter((p) => p.approval_status === "pending").length}</h2></div>
            <div className="panel"><div className="muted">Modeller</div><h2>{models.length}</h2></div>
            <div className="panel"><div className="muted">İstekler</div><h2>{jobs.length}</h2></div>
            <div className="panel"><div className="muted">Kullanım kayıtları</div><h2>{usage.length}</h2></div>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
