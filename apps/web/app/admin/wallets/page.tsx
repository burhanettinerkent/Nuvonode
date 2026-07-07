"use client";

import { FormEvent, useState } from "react";
import { Shell } from "@/components/Shell";
import { ErrorMessage } from "@/components/State";
import { adjustAdminWallet, type AdminWalletAdjustResponse } from "@/lib/api";

export default function AdminWalletsPage() {
  const [userID, setUserID] = useState("");
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
      setError(new Error("Enter a valid credit amount."));
      return;
    }
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      if (!confirm(`Adjust wallet ${userID} by ${amountCredits} credits?\nReason: ${reason}`)) return;
      const res = await adjustAdminWallet(userID, amountCredits, reason);
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
        <h1>Admin Wallets</h1>
        <div className="notice warn">
          Wallet adjustments move internal usage credits only. Credits are not money, cannot be withdrawn, and do not create payout or crypto obligations. Every adjustment writes wallet ledger and audit entries.
        </div>
        <form className="card stack" onSubmit={submit}>
          <div className="field">
            <label htmlFor="user-id">User public id</label>
            <input id="user-id" required value={userID} onChange={(event) => setUserID(event.target.value)} placeholder="usr_..." />
            <div className="muted">Use the target user public id. Positive amounts credit the user; negative amounts debit the user.</div>
          </div>
          <div className="field">
            <label htmlFor="amount">Credit amount</label>
            <input id="amount" required type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="reason">Reason</label>
            <textarea id="reason" required value={reason} onChange={(event) => setReason(event.target.value)} />
            <div className="muted">Use a specific operational reason; this text is stored with the adjustment record.</div>
          </div>
          <label className="row">
            <input checked={confirmed} required type="checkbox" onChange={(event) => setConfirmed(event.target.checked)} />
            I confirm this wallet adjustment should write a ledger and audit entry.
          </label>
          <button className="button" disabled={saving || !confirmed} type="submit">{saving ? "Adjusting..." : "Adjust wallet"}</button>
        </form>
        {error ? <ErrorMessage error={error} /> : null}
        {result ? <div className="notice">Wallet {result.wallet.id} balance: {result.wallet.balance_credits}, reserved: {result.wallet.reserved_credits}</div> : null}
      </div>
    </Shell>
  );
}
