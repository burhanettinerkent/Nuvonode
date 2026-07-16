"use client";

import { useEffect, useState } from "react";

export function CopyBox({ value }: { value: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => setStatus("idle"), [value]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="stack">
      <pre>{value}</pre>
      <button className="button secondary" type="button" onClick={copy}>
        {status === "copied" ? "Kopyalandı" : status === "error" ? "Kopyalama başarısız" : "Kopyala"}
      </button>
      <div aria-live="polite" className="muted">
        {status === "copied" ? "Panoya kopyalandı." : status === "error" ? "Panoya erişilemedi. Metni seçip elle kopyala." : ""}
      </div>
    </div>
  );
}
