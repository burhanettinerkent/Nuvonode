import Link from "next/link";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <header className="public-topbar">
        <Link href="/" className="public-brand">
          <span className="public-brand-mark">N</span>
          <span>
            <strong>Nuvonode</strong>
            <small>Önce API. Node sonra.</small>
          </span>
        </Link>

        <nav className="public-nav desktop-only" aria-label="Ana gezinme">
          <Link href="/#api">API</Link>
          <Link href="/#node">Node</Link>
          <Link href="/#limits">Sınırlar</Link>
        </nav>

        <div className="public-actions">
          <Link className="button secondary" href="/login">Giriş yap</Link>
          <Link className="button" href="/register">Hesap oluştur</Link>
        </div>
      </header>

      <main className="public-main">{children}</main>

      <footer className="public-footer">
        <div className="public-footer-row">
          <div className="stack">
            <strong>Nuvonode</strong>
            <p className="muted">Tek API ile başla. Node'u sonra eklersin.</p>
          </div>
          <div className="public-footer-links">
            <Link href="/#api">API</Link>
            <Link href="/#node">Node</Link>
            <Link href="/login">Giriş yap</Link>
            <a href="https://github.com/burhanettinerkent/Nuvonode" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
        <div className="public-footer-note muted">
          Dahili kredi kullanılır. Bazı istekler topluluk node'larında işlenebilir.
        </div>
      </footer>
    </div>
  );
}
