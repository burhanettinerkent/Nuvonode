"use client";

import Link from "next/link";
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

  const hasProjects = projects.length > 0;
  const hasUsage = usage.length > 0;
  const primaryHref = !hasProjects ? "/dashboard/projects" : "/dashboard/api-keys";
  const primaryLabel = !hasProjects ? "İlk uygulamanı oluştur" : "API anahtarı oluştur";

  return (
    <Shell>
      <div className="stack">
        <div className="card stack">
          <span className="eyebrow">İlk adımlar</span>
          <div className="stack">
            <h1>İlk API yanıtını birkaç adımda al.</h1>
            <p className="muted">
              Önce bir uygulama oluştur, sonra API anahtarını kopyala ve örnek isteği çalıştır.
              İstersen daha sonra node çalıştırıp kredi kazanabilirsin.
            </p>
          </div>
          <div className="row">
            <Link className="button" href={primaryHref}>{primaryLabel}</Link>
            <Link className="button secondary" href="/dashboard/providers">Node çalıştır</Link>
          </div>
          <ul className="checklist">
            <li>
              <div>
                <strong>1. Uygulama oluştur</strong>
                <div className="muted">API anahtarın bir uygulamaya bağlı çalışır.</div>
              </div>
              <span className={hasProjects ? "pill ok" : "pill warn"}>{hasProjects ? "Hazır" : "Sıradaki adım"}</span>
            </li>
            <li>
              <div>
                <strong>2. API anahtarı oluştur</strong>
                <div className="muted">Anahtarı bir kez görürsün. Kopyalayıp hemen kullan.</div>
              </div>
              <span className={hasProjects && !hasUsage ? "pill warn" : hasUsage ? "pill ok" : "pill"}>{hasUsage ? "Tamamlandı" : hasProjects ? "Hazır" : "Bekliyor"}</span>
            </li>
            <li>
              <div>
                <strong>3. İlk isteğini çalıştır</strong>
                <div className="muted">Örnek curl komutunu kopyala, sonucu kullanım sayfanda gör.</div>
              </div>
              <span className={hasUsage ? "pill ok" : "pill"}>{hasUsage ? "Aktif" : "Bekliyor"}</span>
            </li>
          </ul>
        </div>

        {loading ? <Loading label="Ana sayfa hazırlanıyor..." /> : null}
        {error ? <ErrorMessage error={error} /> : null}

        {!loading && !error ? (
          <>
            <div className="grid">
              <div className="panel"><div className="muted">Harcanabilir bakiye</div><h2>{wallet?.balance ?? 0}</h2></div>
              <div className="panel"><div className="muted">Uygulamalar</div><h2>{projects.filter((p) => p.status === "active").length}</h2></div>
              <div className="panel"><div className="muted">Node'larım</div><h2>{providers.length}</h2></div>
              <div className="panel"><div className="muted">İstekler</div><h2>{usage.length}</h2></div>
            </div>
            <div className="grid">
              <CreditNotice />
              <PrivacyNotice />
            </div>
            {hasUsage ? (
              <div className="card stack">
                <h2>Her şey hazır görünüyor</h2>
                <p className="muted">Kullanım geçmişine bakabilir, bakiyeni kontrol edebilir veya node çalıştırarak yeni kredi kazanabilirsin.</p>
                <div className="row">
                  <Link className="button" href="/dashboard/usage">Kullanımı gör</Link>
                  <Link className="button secondary" href="/dashboard/credits">Bakiyeyi aç</Link>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </Shell>
  );
}
