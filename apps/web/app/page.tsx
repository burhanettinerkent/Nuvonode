import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";

export default function HomePage() {
  return (
    <PublicShell>
      <section className="public-hero">
        <div className="public-hero-copy stack">
          <span className="eyebrow">API</span>
          <h1>Açık modellere tek API.</h1>
          <p className="public-lead muted">Hesap aç, anahtarını oluştur, ilk isteğini hemen gönder.</p>
          <div className="row">
            <Link className="button" href="/register">API anahtarı al</Link>
            <Link className="button secondary" href="/login">Giriş yap</Link>
          </div>
          <div className="public-hero-proof muted">Node çalıştırmak istersen sonra eklersin.</div>
        </div>

        <div className="public-hero-panel stack">
          <div className="surface-head">
            <div>
              <h2>İlk istek</h2>
              <p className="muted">Anahtarı oluştur. Sonra bunu çalıştır.</p>
            </div>
            <span className="pill">API</span>
          </div>
          <pre>{`curl http://localhost:18080/v1/chat/completions \
  -H "Authorization: Bearer pvn_xxx" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-7b-instruct","messages":[{"role":"user","content":"Merhaba"}]}'`}</pre>
          <div className="public-node-steps">
            <span>Hesap aç</span>
            <span>Anahtar oluştur</span>
            <span>İsteği gönder</span>
          </div>
        </div>
      </section>

      <section id="api" className="public-section">
        <div className="public-section-head stack">
          <span className="eyebrow">API</span>
          <h2>Başlamak kısa sürer.</h2>
          <p className="muted">Tek hesap, tek anahtar, tek örnek istek yeter.</p>
        </div>
        <div className="public-node-steps">
          <span>Hesap aç</span>
          <span>İlk anahtarı oluştur</span>
          <span>İsteği gönder</span>
        </div>
      </section>

      <section id="node" className="public-section">
        <div className="public-section-head stack">
          <span className="eyebrow">Node</span>
          <h2>İstersen sonra node çalıştır.</h2>
          <p className="muted">Node oluştur, komutu çalıştır, durumu panelden gör.</p>
        </div>
        <div className="public-node-strip stack">
          <div className="public-node-steps">
            <span>Node oluştur</span>
            <span>Anahtarı kopyala</span>
            <span>Komutu çalıştır</span>
            <span>Durumu gör</span>
          </div>
          <div className="muted">Node yolu sekonder. Önce API ile başla.</div>
        </div>
      </section>

      <section id="limits" className="public-section">
        <div className="public-section-head stack">
          <span className="eyebrow">Sınırlar</span>
          <h2>Kredi içeride kalır.</h2>
          <p className="muted">Dahili kredi kullanılır. Hassas veri için topluluk node'larını seçme.</p>
        </div>
      </section>

      <section className="public-band">
        <div className="stack">
          <span className="eyebrow">Şimdi başla</span>
          <h2>Hazırsan şimdi başla.</h2>
        </div>
        <div className="row">
          <Link className="button" href="/register">Hesap oluştur</Link>
          <Link className="button secondary" href="/login">Giriş yap</Link>
        </div>
      </section>
    </PublicShell>
  );
}
