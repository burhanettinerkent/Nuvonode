"use client";

import { useEffect, useState } from "react";
import { CreditNotice } from "@/components/CreditNotice";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { getWallet, listLedger, type LedgerEntry, type Wallet } from "@/lib/api";

export default function CreditsPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWallet(), listLedger()])
      .then(([walletRes, ledgerRes]) => {
        setWallet(walletRes);
        setLedger(ledgerRes.ledger);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="stack">
        <h1>Credits</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading /> : null}
        {!loading && !error ? (
          <>
            <div className="grid">
              <div className="panel"><div className="muted">Available credits</div><h2>{wallet?.balance_credits ?? 0}</h2></div>
              <div className="panel"><div className="muted">Reserved credits</div><h2>{wallet?.reserved_credits ?? 0}</h2></div>
            </div>
            <CreditNotice />
            {ledger.length === 0 ? <Empty label="No ledger entries yet." /> : (
              <table>
                <thead><tr><th>Type</th><th>Amount</th><th>Reserved delta</th><th>Balance after</th><th>Reason</th><th>Created</th></tr></thead>
                <tbody>
                  {ledger.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.entry_type}<div className="muted">{entry.id}</div></td>
                      <td>{entry.amount_credits}</td>
                      <td>{entry.reserved_delta}</td>
                      <td>{entry.balance_after}</td>
                      <td>{entry.reason || "—"}</td>
                      <td>{new Date(entry.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : null}
      </div>
    </Shell>
  );
}
