"use client";

import { FormEvent, useState } from "react";
import { ErrorMessage, SuccessMessage } from "@/components/State";
import { adjustAdminWallet, type AdminWalletAdjustResponse } from "@/lib/api";

export default function AdminCreditAdjustmentPage() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<AdminWalletAdjustResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountCredits = Number(amount);
    if (!Number.isFinite(amountCredits)) {
      setError(new Error("Geçerli bir kredi miktarı gir."));
      return;
    }
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      if (!confirm(`Kullanıcı ${email} için ${amountCredits} kredi düzenlemesi?\nSebep: ${reason}`)) return;
      const res = await adjustAdminWallet(email, amountCredits, reason);
      setResult(res);
      setAmount("");
      setReason("");
      setConfirmed(false);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <section className="card stack split-panel" style={{ padding: 32 }}>
        <div className="stack">
          <span className="eyebrow">Kredi düzeltmesi</span>
          <h1>Bakiyeyi kontrollü şekilde düzenle.</h1>
          <p className="muted" style={{ maxWidth: 620 }}>Bu ekran istisna durumlar içindir. Her işlem hareket kaydına ve denetime yazılır.</p>
        </div>
        <div className="notice warn">Bu kredi dahili platform kredisidir. Nakit veya çekim sistemi değildir.</div>
      </section>

      <section className="split-panel">
        <form className="card stack" onSubmit={submit}>
          <div className="surface-head">
            <div>
              <h2>Kredi düzenle</h2>
              <p className="muted">Email, miktar ve sebep olmadan ilerleme yok.</p>
            </div>
          </div>
          <div className="field">
            <label htmlFor="user-email">Kullanıcı email</label>
            <input id="user-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ornek@email.com" />
          </div>
          <div className="field">
            <label htmlFor="amount">Kredi miktarı</label>
            <input id="amount" required type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="reason">Sebep</label>
            <textarea id="reason" required value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>
          <label className="row">
            <input checked={confirmed} required type="checkbox" onChange={(event) => setConfirmed(event.target.checked)} />
            Bu işlemin hareket ve denetim kaydına yazılacağını onaylıyorum.
          </label>
          <button className="button" disabled={saving || !confirmed} type="submit">{saving ? "Düzenleniyor..." : "Kredi düzenle"}</button>
        </form>

        <div className="card stack secondary-card">
          <h2>Operasyon notu</h2>
          <ul className="checklist">
            <li><strong>Hareket kaydı zorunlu</strong><span className="muted">Bu ekran yalnızca kayıtlı düzeltme için vardır.</span></li>
            <li><strong>Sebep zorunlu</strong><span className="muted">Destek ve denetim için görünür kalır.</span></li>
            <li><strong>Dikkatli kullan</strong><span className="muted">Normal ürün akışı için değil, istisna durumlar için kullan.</span></li>
          </ul>
          {result ? <SuccessMessage message={`Güncel bakiye: ${result.wallet.balance}`} /> : <div className="muted">Sonuç burada görünür.</div>}
        </div>
      </section>

      {error ? <ErrorMessage error={error} hint="Düzenleme yapılamadı. Bilgileri kontrol edip tekrar dene." /> : null}
    </div>
  );
}
