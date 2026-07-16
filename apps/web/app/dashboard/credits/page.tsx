"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { getWallet, listLedger, type LedgerEntry, type Wallet } from "@/lib/api";

function movementLabel(entryType: string) {
  switch (entryType) {
    case "grant":
      return "Başlangıç kredisi";
    case "reserve":
      return "İstek için ayrıldı";
    case "release_reserve":
      return "Ayrılan kredi geri bırakıldı";
    case "debit_usage":
      return "API kullanımı";
    case "credit_provider_reward":
      return "Node kazancı";
    case "admin_adjustment":
      return "Yönetici düzenlemesi";
    case "refund":
      return "İade";
    default:
      return "Kredi hareketi";
  }
}

function movementNote(entry: LedgerEntry) {
  if (!entry.reason) return "—";
  if (entry.reason.startsWith("admin_adjustment:")) {
    return `Yönetici notu: ${entry.reason.replace("admin_adjustment:", "").trim() || "Düzenleme"}`;
  }
  switch (entry.reason) {
    case "starting_free_credits":
      return "Hesap açılışında verilen kredi";
    case "chat_completion_reservation":
      return "İstek gönderilmeden önce ayrılan kredi";
    case "release_usage_reservation":
    case "provider_unavailable_release":
    case "provider_failed_release":
    case "settlement_failed_release":
      return "Ayrılan kredi tekrar bakiyeye döndü";
    case "chat_completion_usage":
      return "Tamamlanan API isteğinin maliyeti";
    default:
      return entry.reason;
  }
}

function formatCredits(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

export default function BalancePage() {
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

  const { earned, spent } = useMemo(() => {
    let totalEarned = 0;
    let totalSpent = 0;

    for (const entry of ledger) {
      if (["grant", "credit_provider_reward", "admin_adjustment", "refund"].includes(entry.entry_type) && entry.amount_credits > 0) {
        totalEarned += entry.amount_credits;
      }
      if (entry.entry_type === "debit_usage" && entry.amount_credits < 0) {
        totalSpent += Math.abs(entry.amount_credits);
      }
    }

    return { earned: totalEarned, spent: totalSpent };
  }, [ledger]);

  const historyRows = useMemo(() => ledger.map((entry) => ({
    ...entry,
    label: movementLabel(entry.entry_type),
    note: movementNote(entry),
    credits: formatCredits(entry.amount_credits),
    at: new Date(entry.created_at).toLocaleString(),
  })), [ledger]);


  return (
    <Shell>
      <div className="stack">
        <div className="stack">
          <h1>Bakiye</h1>
          <p className="muted">Node çalıştırarak kredi kazan, aynı kredileri API isteklerinde harca.</p>
        </div>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading label="Bakiye hazırlanıyor..." /> : null}
        {!loading && !error ? (
          <>
            <div className="grid">
              <div className="panel"><div className="muted">Harcanabilir bakiye</div><h2>{wallet?.balance ?? 0}</h2></div>
              <div className="panel"><div className="muted">Node ve eklenen krediler</div><h2>{earned}</h2></div>
              <div className="panel"><div className="muted">API kullanımı</div><h2>{spent}</h2></div>
            </div>
            <div className="notice">Kazandığın kredileri API isteklerinde kullanabilirsin. Kredi bakiyen dahili platform kredisidir, nakde çevrilemez.</div>
            {ledger.length === 0 ? (
              <div className="card stack">
                <Empty label="Henüz hiç kredi hareketi yok." />
                <div className="muted">İlk API isteğini yaparak harcamayı, node çalıştırarak da kazancı burada görmeye başlarsın.</div>
                <div className="row">
                  <Link className="button" href="/dashboard/api-keys">İlk isteği yap</Link>
                </div>
              </div>
            ) : (
              <div className="stack">
                <h2>Son hareketler</h2>
                <div className="surface desktop-only">
                  <table>
                    <thead><tr><th>Hareket</th><th>Kredi</th><th>Not</th><th>Tarih</th></tr></thead>
                    <tbody>
                      {historyRows.map((entry) => (
                        <tr key={entry.id}>
                          <td>
                            <strong>{entry.label}</strong>
                            <div className="muted">Hareket sonrası bakiye {entry.balance_after}</div>
                          </td>
                          <td>{entry.credits}</td>
                          <td>{entry.note}</td>
                          <td>{entry.at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mobile-only mobile-list">
                  {historyRows.map((entry) => (
                    <div key={entry.id} className="mobile-item">
                      <div className="row">
                        <strong>{entry.label}</strong>
                        <span>{entry.credits}</span>
                      </div>
                      <div className="meta muted">
                        <div>{entry.note}</div>
                        <div>Hareket sonrası bakiye {entry.balance_after}</div>
                        <div>{entry.at}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </Shell>
  );
}
