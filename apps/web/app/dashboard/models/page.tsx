"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { listModels, type Model } from "@/lib/api";

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listModels()
      .then((res) => setModels(res.models))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="stack">
        <h1>Models</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {loading ? <Loading /> : null}
        {!loading && models.length === 0 ? <Empty label="No active models available." /> : null}
        {models.length > 0 ? (
          <div className="surface">
            <table>
              <thead><tr><th>Model</th><th>Status</th><th>Context</th><th>Credits / 1K tokens</th><th>Community</th><th>VRAM</th></tr></thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id}>
                    <td><strong>{model.display_name}</strong><div className="muted">{model.slug}</div><div>{model.description}</div></td>
                    <td><StatusPill value={model.status} /></td>
                    <td>{model.context_length}</td>
                    <td>In {model.input_credit_per_1k} / Out {model.output_credit_per_1k}</td>
                    <td><StatusPill value={model.community_allowed ? "allowed" : "not_allowed"} /></td>
                    <td>{model.min_vram_mb || "—"} / {model.recommended_vram_mb || "—"} MB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
