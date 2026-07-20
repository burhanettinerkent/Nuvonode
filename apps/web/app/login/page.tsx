"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PublicShell } from "@/components/PublicShell";
import { ErrorMessage } from "@/components/State";
import { login } from "@/lib/api";
import { setToken } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      setToken(res.access_token);
      router.replace("/dashboard");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <section className="auth-stage">
        <div className="auth-copy stack">
          <span className="eyebrow">Giriş yap</span>
          <h1>Hesabına dön.</h1>
          <p className="muted">İçeri gir. API anahtarını gör. Kaldığın yerden devam et.</p>
        </div>

        <form className="auth-card stack" onSubmit={submit}>
          <div className="stack">
            <h2>Giriş yap</h2>
            <p className="muted">Sadece e-posta ve şifre.</p>
          </div>
          {error ? <ErrorMessage error={error} hint="Bilgileri kontrol edip tekrar dene." /> : null}
          <div className="field">
            <label htmlFor="login-email">E-posta</label>
            <input id="login-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="login-password">Şifre</label>
            <input id="login-password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="button" type="submit" disabled={loading}>{loading ? "Giriş yapılıyor..." : "Devam et"}</button>
          <p className="muted">Hesabın yok mu? <Link href="/register">Hesap oluştur</Link></p>
        </form>
      </section>
    </PublicShell>
  );
}
