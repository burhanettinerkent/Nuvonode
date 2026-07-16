"use client";

import { FormEvent, useState } from "react";
import { Shell } from "@/components/Shell";
import { ErrorMessage } from "@/components/State";
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
    <Shell>
      <div className="stack">
        <h1>Kredi düzenleme</h1>
        <div className="notice warn">
          Kredi düzenlemeleri dahili platform kredilerini etkiler. Her işlem hareket ve denetim kaydına yazılır. Pozitif miktar kullanıcıya kredi ekler, negatif miktar keser.
        </div>
        <form className="card stack" onSubmit={submit}>
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
        {error ? <ErrorMessage error={error} /> : null}
        {result ? <div className="notice">Güncel bakiye: {result.wallet.balance}</div> : null}
      </div>
    </Shell>
  );
}
