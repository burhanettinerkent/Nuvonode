"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { register } from "@/lib/api";
import { setToken } from "@/lib/session";
import { ErrorMessage } from "@/components/State";

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
    <main className="page">
      <section className="hero">
        <div className="stack">
          <Link href="/" className="badge">Nuvonode</Link>
          <h1>API anahtarı al, hemen başla.</h1>
          <p className="muted">Bir API anahtarı ile tüm modelleri çağır. İstersen sonra node çalıştırıp kredi kazanmaya başla.</p>
        </div>
        <form className="card stack" onSubmit={submit}>
          <h2>Hesap oluştur</h2>
          {error ? <ErrorMessage error={error} /> : null}
          <div className="field">
            <label htmlFor="register-email">Email</label>
            <input id="register-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="register-password">Şifre</label>
            <input id="register-password" required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="button" type="submit" disabled={loading}>{loading ? "Oluşturuluyor..." : "Hesap oluştur"}</button>
          <p className="muted">Zaten hesabın var mı? <Link href="/login">Giriş yap</Link></p>
        </form>
      </section>
    </main>
  );
}
