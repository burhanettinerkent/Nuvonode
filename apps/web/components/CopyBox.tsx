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
        {status === "copied" ? "Copied" : status === "error" ? "Copy failed" : "Copy"}
      </button>
      <div aria-live="polite" className="muted">
        {status === "copied" ? "Copied to clipboard." : status === "error" ? "Clipboard access failed. Select and copy manually." : ""}
      </div>
    </div>
  );
}
