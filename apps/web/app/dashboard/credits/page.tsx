"use client";

import { useEffect, useState } from "react";
import { CreditNotice } from "@/components/CreditNotice";
import { StatusPill } from "@/components/Display";
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
        <h1>Bakiye</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading /> : null}
        {!loading && !error ? (
          <>
            <div className="grid">
              <div className="panel"><div className="muted">Harcanabilir bakiye</div><h2>{wallet?.balance ?? 0}</h2></div>
            </div>
            <CreditNotice />
            {ledger.length === 0 ? <Empty label="Henüz hiç hareket yok." /> : (
              <div className="surface">
                <table>
                  <thead><tr><th>Tip</th><th>Miktar</th><th>Kalan bakiye</th><th>Açıklama</th><th>Tarih</th></tr></thead>
                  <tbody>
                    {ledger.map((entry) => (
                      <tr key={entry.id}>
                        <td><StatusPill value={entry.entry_type} /></td>
                        <td>{entry.amount_credits}</td>
                        <td>{entry.balance_after}</td>
                        <td>{entry.reason || "—"}</td>
                        <td>{new Date(entry.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </div>
    </Shell>
  );
}
