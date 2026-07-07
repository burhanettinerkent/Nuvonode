"use client";

import { useEffect, useState } from "react";
import { CreditNotice } from "@/components/CreditNotice";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { Shell } from "@/components/Shell";
import { ErrorMessage, Loading } from "@/components/State";
import { getWallet, listProjects, listProviders, listUsage, type Project, type Provider, type UsageRecord, type Wallet } from "@/lib/api";

export default function DashboardPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWallet(), listProjects(), listProviders(), listUsage()])
      .then(([walletRes, projectRes, providerRes, usageRes]) => {
        setWallet(walletRes);
        setProjects(projectRes.projects);
        setProviders(providerRes.providers);
        setUsage(usageRes.usage);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="stack">
        <div className="stack">
          <span className="eyebrow">Workspace overview</span>
          <h1>Inference operations</h1>
          <p className="muted">Track credits, project activity, provider readiness, and recent usage from the Nuvonode control plane.</p>
        </div>
        {loading ? <Loading /> : null}
        {error ? <ErrorMessage error={error} /> : null}
        {!loading && !error ? (
          <>
            <div className="grid">
              <div className="panel"><div className="muted">Available credits</div><h2>{wallet?.balance_credits ?? 0}</h2></div>
              <div className="panel"><div className="muted">Reserved credits</div><h2>{wallet?.reserved_credits ?? 0}</h2></div>
              <div className="panel"><div className="muted">Active projects</div><h2>{projects.filter((p) => p.status === "active").length}</h2></div>
              <div className="panel"><div className="muted">Provider nodes</div><h2>{providers.length}</h2></div>
              <div className="panel"><div className="muted">Usage records</div><h2>{usage.length}</h2></div>
            </div>
            <div className="grid">
              <CreditNotice />
              <PrivacyNotice />
            </div>
          </>
        ) : null}
      </div>
    </Shell>
  );
}
