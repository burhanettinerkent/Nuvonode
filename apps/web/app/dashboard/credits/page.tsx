"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CreditNotice } from "@/components/CreditNotice";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { getWallet, listLedger, type LedgerEntry, type Wallet } from "@/lib/api";

function movementLabel(entryType: string) {
  switch (entryType) {
    case "grant":
      return "Başlangıç kredisi";
    case "reserve":
      return "İstek bekliyor";
    case "release_reserve":
      return "Kullanılmayan kredi geri döndü";
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
      return "İstek tamamlanana kadar geçici olarak ayrıldı";
    case "release_usage_reservation":
    case "provider_unavailable_release":
    case "provider_failed_release":
    case "settlement_failed_release":
      return "Kullanılmayan kısım tekrar bakiyeye döndü";
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
    <div className="stack">
      <section className="card stack" style={{ padding: 32 }}>
        <div className="split-panel">
          <div className="stack">
            <span className="eyebrow">Bakiye</span>
            <h1>Bakiyeni ve son hareketleri gör.</h1>
            <p className="muted" style={{ maxWidth: 620 }}>Kazandığın kredi de kullandığın kredi de aynı geçmişte görünür.</p>
            <div className="row">
              <Link className="button" href="/dashboard/api-keys">API'yi aç</Link>
              <Link className="button secondary" href="/dashboard/providers">Node'u aç</Link>
            </div>
          </div>
          <div className="grid stat-strip">
            <div className="metric"><strong>{wallet?.balance ?? 0}</strong><span className="muted">Harcanabilir</span></div>
            <div className="metric"><strong>{earned}</strong><span className="muted">Toplam kazanç</span></div>
            <div className="metric"><strong>{spent}</strong><span className="muted">Toplam kullanım</span></div>
          </div>
        </div>
      </section>

      <CreditNotice />
      <div className="muted">Bu kredi nakit değildir.</div>
      {error ? <ErrorMessage error={error} hint="Bakiye bilgisi alınamadı. Sayfayı yenileyip tekrar dene." /> : null}
      {loading ? <Loading label="Bakiye yükleniyor..." hint="Son hareketlerin hazırlanıyor." /> : null}

      {!loading && !error ? (
        ledger.length === 0 ? (
          <div className="card stack">
            <Empty label="Henüz hareket yok." hint="İlk istek ya da ilk node işi burada görünür." />
            <div className="row">
              <Link className="button" href="/dashboard/api-keys">API'yi aç</Link>
            </div>
          </div>
        ) : (
          <section className="card stack">
            <div className="surface-head">
              <div>
                <h2>Son hareketler</h2>
                <p className="muted">Yeni hareketler üstte görünür.</p>
              </div>
            </div>
            <div className="surface desktop-only">
              <table>
                <thead><tr><th>Hareket</th><th>Kredi</th><th>Açıklama</th><th>Tarih</th></tr></thead>
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
          </section>
        )
      ) : null}
    </div>
  );
}
