"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PublicShell } from "@/components/PublicShell";
import { ErrorMessage } from "@/components/State";
import { register } from "@/lib/api";
import { setToken } from "@/lib/session";

export default function RegisterPage() {
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
      const res = await register("User", email, password);
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
          <span className="eyebrow">Hesap aç</span>
          <h1>Hemen başla.</h1>
          <p className="muted">Kaydol. İlk anahtarını oluştur. İlk isteğini gönder.</p>
        </div>

        <form className="auth-card stack" onSubmit={submit}>
          <div className="stack">
            <h2>Hesap oluştur</h2>
            <p className="muted">Sadece e-posta ve şifre yeter.</p>
          </div>
          {error ? <ErrorMessage error={error} hint="Bilgileri kontrol edip tekrar dene." /> : null}
          <div className="field">
            <label htmlFor="register-email">E-posta</label>
            <input id="register-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="register-password">Şifre</label>
            <input id="register-password" required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="button" type="submit" disabled={loading}>{loading ? "Hesap açılıyor..." : "Hesabı aç"}</button>
          <p className="muted">Zaten hesabın var mı? <Link href="/login">Giriş yap</Link></p>
        </form>
      </section>
    </PublicShell>
  );
}
