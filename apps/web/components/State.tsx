export function Loading({ label = "Yükleniyor..." }: { label?: string }) {
  return <div className="notice">{label}</div>;
}

export function Empty({ label }: { label: string }) {
  return <div className="notice">{label}</div>;
}

export function SuccessMessage({ message }: { message: string }) {
  return <div className="notice"><strong>{message}</strong></div>;
}

export function ErrorMessage({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Bir şey yanlış gitti.";
  const requestID = typeof error === "object" && error && "requestID" in error ? String(error.requestID) : "";
  return (
    <div className="error">
      <strong>{message}</strong>
      {requestID ? <div>İstek kimliği: {requestID}</div> : null}
    </div>
  );
}
