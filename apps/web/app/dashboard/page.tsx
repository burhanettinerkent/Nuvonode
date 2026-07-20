"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CopyBox } from "@/components/CopyBox";
import { CreditNotice } from "@/components/CreditNotice";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { getWallet, listAPIKeys, listProjects, listProviders, listUsage, type Project, type Provider, type UsageRecord, type Wallet } from "@/lib/api";

const starterRequest = `curl http://localhost:18080/v1/chat/completions \
  -H "Authorization: Bearer pvn_kopyaladigin_anahtar" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-7b-instruct","messages":[{"role":"user","content":"Merhaba"}]}'`;

export default function DashboardPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [hasActiveKey, setHasActiveKey] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [walletRes, projectRes, providerRes, usageRes] = await Promise.all([
          getWallet(),
          listProjects(),
          listProviders(),
          listUsage(),
        ]);

        if (cancelled) return;
        setWallet(walletRes);
        setProjects(projectRes.projects);
        setProviders(providerRes.providers);
        setUsage(usageRes.usage);

        if (projectRes.projects.length === 0) {
          setHasActiveKey(false);
          return;
        }

        const keySets = await Promise.all(projectRes.projects.map((project) => listAPIKeys(project.id)));
        if (cancelled) return;
        setHasActiveKey(keySets.some((result) => result.api_keys.some((key) => key.status === "active")));
      } catch (err) {
        if (cancelled) return;
        setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasProjects = projects.length > 0;
  const hasUsage = usage.length > 0;
  const onlineProviders = providers.filter((provider) => provider.instance_status === "online").length;

  const nextStep = useMemo(() => {
    if (!hasProjects) {
      return {
        title: "Önce proje oluştur.",
        body: "Bir proje aç. Sonra anahtar oluşturup ilk isteğini gönder.",
        primaryHref: "/dashboard/projects",
        primaryLabel: "Proje oluştur",
        secondaryHref: "/dashboard/providers",
        secondaryLabel: "Node'u sonra aç",
        commandTitle: "İlk sıra",
        commandBody: "İlk istek için tek proje yeter.",
        showCommand: false,
      };
    }

    if (!hasActiveKey) {
      return {
        title: "Şimdi anahtar oluştur.",
        body: "Projen hazır. Anahtarı oluştur, kopyala, ilk isteğini gönder.",
        primaryHref: "/dashboard/api-keys",
        primaryLabel: "Anahtar oluştur",
        secondaryHref: "/dashboard/providers",
        secondaryLabel: "Node'u sonra aç",
        commandTitle: "Sıradaki iş",
        commandBody: "Anahtar oluşunca örnek komutu aynı sayfada kopyalayabilirsin.",
        showCommand: false,
      };
    }

    return {
      title: hasUsage ? "API hazır." : "İlk isteği gönder.",
      body: hasUsage
        ? "İsteklerini izle. İstersen sonra node ekle."
        : "Anahtar hazır. Örnek komutu kopyala, sonucu isteklerinde gör.",
      primaryHref: "/dashboard/api-keys",
      primaryLabel: hasUsage ? "API'yi aç" : "Komutu gör",
      secondaryHref: "/dashboard/usage",
      secondaryLabel: hasUsage ? "İstekleri gör" : "İstek geçmişi",
      commandTitle: hasUsage ? "Hazır komut" : "İlk komut",
      commandBody: hasUsage
        ? "Aynı istek kalıbını tekrar kullanabilirsin."
        : "Anahtarı API sayfasından kopyalayıp bu komuta yerleştir.",
      showCommand: true,
    };
  }, [hasActiveKey, hasProjects, hasUsage]);

  return (
    <div className="stack">
      <section className="card stack" style={{ padding: 32 }}>
        <div className="split-panel">
          <div className="stack">
            <div className="stack">
              <span className="eyebrow">Şimdi</span>
              <h1>{nextStep.title}</h1>
              <p className="muted" style={{ maxWidth: 620 }}>{nextStep.body}</p>
            </div>
            <div className="row">
              <Link className="button" href={nextStep.primaryHref}>{nextStep.primaryLabel}</Link>
              <Link className="button secondary" href={nextStep.secondaryHref}>{nextStep.secondaryLabel}</Link>
            </div>
          </div>

          <div className="card stack secondary-card" style={{ padding: 22 }}>
            <div className="surface-head">
              <div>
                <h2>{nextStep.commandTitle}</h2>
                <p className="muted">{nextStep.commandBody}</p>
              </div>
              <span className="pill">API</span>
            </div>
            {nextStep.showCommand ? (
              <CopyBox value={starterRequest} />
            ) : (
              <ul className="checklist">
                <li><strong>Proje</strong><span className="muted">{hasProjects ? "Hazır" : "Eksik"}</span></li>
                <li><strong>Anahtar</strong><span className="muted">{hasActiveKey ? "Hazır" : "Eksik"}</span></li>
                <li><strong>İstek</strong><span className="muted">{hasUsage ? "Var" : "Yok"}</span></li>
              </ul>
            )}
          </div>
        </div>
      </section>

      {loading ? <Loading label="Panel hazırlanıyor..." hint="Bakiye, proje ve istek durumu yükleniyor." /> : null}
      {error ? <ErrorMessage error={error} hint="Panel verileri alınamadı. Sayfayı yenileyip tekrar dene." /> : null}

      {!loading && !error ? (
        <>
          {!hasProjects ? (
            <section className="card stack">
              <Empty label="Başlamak için proje eksik." hint="Önce proje oluştur. Sonra ilk anahtarını aç." />
              <div className="row">
                <Link className="button" href="/dashboard/projects">Proje oluştur</Link>
              </div>
            </section>
          ) : null}

          <section className="grid stat-strip">
            <div className="metric"><strong>{wallet?.balance ?? 0}</strong><span className="muted">Harcanabilir bakiye</span></div>
            <div className="metric"><strong>{projects.filter((project) => project.status === "active").length}</strong><span className="muted">Aktif proje</span></div>
            <div className="metric"><strong>{usage.length}</strong><span className="muted">İstek kaydı</span></div>
            <div className="metric"><strong>{onlineProviders}</strong><span className="muted">Çevrimiçi node</span></div>
          </section>

          <section className="split-panel">
            <div className="card stack">
              <div className="surface-head">
                <div>
                  <h2>Ne hazır?</h2>
                  <p className="muted">Hesabının şu anki durumu.</p>
                </div>
              </div>
              <ul className="checklist">
                <li><strong>Proje</strong><span className="muted">{hasProjects ? "Hazır" : "Eksik"}</span></li>
                <li><strong>Anahtar</strong><span className="muted">{hasActiveKey ? "Hazır" : "Eksik"}</span></li>
                <li><strong>İstek</strong><span className="muted">{hasUsage ? "Var" : "Yok"}</span></li>
                <li><strong>Node</strong><span className="muted">{onlineProviders > 0 ? "Çevrimiçi node var" : "Henüz yok"}</span></li>
              </ul>
            </div>

            <div className="stack">
              <CreditNotice />
              <PrivacyNotice />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
