import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="stack">
          <span className="badge">Nuvonode</span>
          <h1>Açık modeller için tek API, isterse tek node yolu.</h1>
          <p className="muted">
            Bir API anahtarı ile modelleri çağır. İstersen daha sonra kendi node'unu çalıştır,
            kredi kazan ve aynı kredileri kullanımında harca.
          </p>
          <div className="row">
            <Link className="button" href="/register">API anahtarı al</Link>
            <Link className="button secondary" href="/dashboard/providers">Node çalıştır</Link>
            <Link className="button secondary" href="/login">Giriş yap</Link>
          </div>
        </div>
        <div className="card stack">
          <h2>Hızlı başlangıç</h2>
          <p className="muted">Hesap oluştur, anahtarını kopyala ve ilk isteğini birkaç saniyede çalıştır.</p>
          <pre>{`curl http://localhost:18080/v1/chat/completions \\
  -H "Authorization: Bearer pvn_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"qwen-7b-instruct","messages":[{"role":"user","content":"Merhaba"}]}'`}</pre>
          <div className="grid">
            <div className="metric"><strong>API kullan</strong><span className="muted">Tek anahtarla başla</span></div>
            <div className="metric"><strong>Node çalıştır</strong><span className="muted">Kredi kazan, sonra harca</span></div>
            <div className="metric"><strong>Kullanımı gör</strong><span className="muted">İsteklerini ve bakiyeni takip et</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}
