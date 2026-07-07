"use client";

export function CopyBox({ value }: { value: string }) {
  return (
    <div className="stack">
      <pre>{value}</pre>
      <button className="button secondary" type="button" onClick={() => navigator.clipboard.writeText(value)}>
        Copy
      </button>
    </div>
  );
}
