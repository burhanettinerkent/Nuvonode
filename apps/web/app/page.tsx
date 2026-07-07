import Link from "next/link";
import { CreditNotice } from "@/components/CreditNotice";
import { PrivacyNotice } from "@/components/PrivacyNotice";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="stack">
          <span className="eyebrow">Open-source AI inference mesh</span>
          <h1>Route AI requests to trusted community GPUs.</h1>
          <p className="muted">
            Nuvonode Mesh gives developers an OpenAI-compatible API, routes jobs to approved Ollama provider nodes, meters usage, and rewards providers with internal platform credits.
          </p>
          <div className="row">
            <Link className="button" href="/register">Start dashboard</Link>
            <Link className="button secondary" href="/login">Login</Link>
            <a className="button secondary" href="https://github.com/burhanettinerkent/Nuvonode">GitHub</a>
          </div>
          <div className="hero-metrics">
            <div className="metric"><strong>OpenAI</strong><span className="muted">compatible API</span></div>
            <div className="metric"><strong>Ollama</strong><span className="muted">local runtime</span></div>
            <div className="metric"><strong>Credits</strong><span className="muted">usage ledger</span></div>
          </div>
        </div>
        <div className="card stack">
          <span className="badge">V1 control plane</span>
          <h2>Built for users, providers, and operators.</h2>
          <div className="grid">
            <div className="metric"><strong>Developers</strong><span className="muted">create projects and API keys</span></div>
            <div className="metric"><strong>Providers</strong><span className="muted">connect GPUs outbound</span></div>
            <div className="metric"><strong>Admins</strong><span className="muted">moderate providers and models</span></div>
          </div>
          <CreditNotice />
          <PrivacyNotice />
        </div>
      </section>
    </main>
  );
}
