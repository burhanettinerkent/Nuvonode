"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { getWallet, listLedger, type LedgerEntry, type Wallet } from "@/lib/api";

export default function BalancePage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [earned, setEarned] = useState(0);
  const [spent, setSpent] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWallet(), listLedger()])
      .then(([walletRes, ledgerRes]) => {
        setWallet(walletRes);
        setLedger(ledgerRes.ledger);
        let totalEarned = 0;
        let totalSpent = 0;
        for (const e of ledgerRes.ledger) {
          if (e.amount_credits > 0) totalEarned += e.amount_credits;
          if (e.amount_credits < 0) totalSpent += Math.abs(e.amount_credits);
        }
        setEarned(totalEarned);
        setSpent(totalSpent);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="stack">
        <h1>Bakiye</h1>
        <p className="muted">Node çalıştırarak kredi kazan, aynı kredileri API isteklerinde harca.</p>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading /> : null}
        {!loading && !error ? (
          <>
            <div className="grid">
              <div className="panel"><div className="muted">Harcanabilir bakiye</div><h2>{wallet?.balance ?? 0}</h2></div>
              <div className="panel"><div className="muted">Kazanılan</div><h2>{earned}</h2></div>
              <div className="panel"><div className="muted">Harcanan</div><h2>{spent}</h2></div>
            </div>
            <div className="notice">Kazandığın kredileri API isteklerinde kullanabilirsin. Kredi bakiyen dahili platform kredisidir, nakde çevrilemez.</div>
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
