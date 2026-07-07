"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login } from "@/lib/api";
import { setToken } from "@/lib/session";
import { ErrorMessage } from "@/components/State";

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
    <main className="page">
      <section className="hero">
        <div className="stack">
          <Link href="/" className="badge">Nuvonode Mesh</Link>
          <span className="eyebrow">Dashboard access</span>
          <h1>Operate your inference workspace.</h1>
          <p className="muted">Manage projects, keys, credits, usage, provider nodes, and admin moderation from one control plane.</p>
        </div>
        <form className="card stack" onSubmit={submit}>
          <h2>Login</h2>
          {error ? <ErrorMessage error={error} /> : null}
          <div className="field">
            <label>Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="button" type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
          <p className="muted">No account? <Link href="/register">Create one</Link></p>
        </form>
      </section>
    </main>
  );
}
