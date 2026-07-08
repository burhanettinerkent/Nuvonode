import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="stack">
          <h1>AI modelleri için tek API.</h1>
          <p className="muted">
            Nuvonode ile OpenAI uyumlu API ile modelleri çağır, kendi node'unu çalıştırıp kredi kazan.
          </p>
          <div className="row">
            <Link className="button" href="/register">API anahtarı al</Link>
            <Link className="button secondary" href="/login">Giriş yap</Link>
            <a className="button secondary" href="https://github.com/burhanettinerkent/Nuvonode">GitHub</a>
          </div>
        </div>
        <div className="card stack">
          <h2>Nasıl çalışır?</h2>
          <div className="grid">
            <div className="metric"><strong>API kullan</strong><span className="muted">OpenAI uyumlu, tek anahtarla</span></div>
            <div className="metric"><strong>Node çalıştır</strong><span className="muted">Kendi bilgisayarını bağla, kredi kazan</span></div>
            <div className="metric"><strong>Harca</strong><span className="muted">Kazandığın kredileri API'de kullan</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}
