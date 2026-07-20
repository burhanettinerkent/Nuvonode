type MessageProps = {
  label?: string;
  hint?: string;
};

export function Loading({ label = "Yükleniyor...", hint }: MessageProps) {
  return (
    <div className="notice stack compact-notice">
      <strong>{label}</strong>
      {hint ? <div className="muted">{hint}</div> : null}
    </div>
  );
}

export function Empty({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="notice stack compact-notice">
      <strong>{label}</strong>
      {hint ? <div className="muted">{hint}</div> : null}
    </div>
  );
}

export function SuccessMessage({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="notice stack compact-notice">
      <strong>{message}</strong>
      {hint ? <div className="muted">{hint}</div> : null}
    </div>
  );
}

export function ErrorMessage({ error, hint = "Birkaç saniye sonra yeniden dene. Sorun sürerse sayfayı yenile veya tekrar giriş yap." }: { error: unknown; hint?: string }) {
  const message = error instanceof Error ? error.message : "Bir şey yanlış gitti.";

  return (
    <div className="error stack compact-notice">
      <strong>{message}</strong>
      <div className="muted">{hint}</div>
    </div>
  );
}
