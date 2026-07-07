"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { register } from "@/lib/api";
import { setToken } from "@/lib/session";
import { ErrorMessage } from "@/components/State";
import { PrivacyNotice } from "@/components/PrivacyNotice";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(new Error("Passwords do not match."));
      return;
    }
    setLoading(true);
    try {
      const res = await register(displayName, email, password);
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
          <span className="eyebrow">Create workspace</span>
          <h1>Start routing open model workloads.</h1>
          <p className="muted">Create projects, generate API keys, connect provider nodes, and track usage credits from the dashboard.</p>
          <PrivacyNotice />
        </div>
        <form className="card stack" onSubmit={submit}>
          <h2>Create account</h2>
          {error ? <ErrorMessage error={error} /> : null}
          <div className="field">
            <label htmlFor="register-display-name">Display name</label>
            <input id="register-display-name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="register-email">Email</label>
            <input id="register-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="register-password">Password</label>
            <input id="register-password" required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="register-confirm-password">Confirm password</label>
            <input id="register-confirm-password" required minLength={8} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button className="button" type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
          <p className="muted">Already have an account? <Link href="/login">Login</Link></p>
        </form>
      </section>
    </main>
  );
}
