"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading, SuccessMessage } from "@/components/State";
import { approveProviderModel, listPendingProviderModels, rejectProviderModel, type ProviderModelAdvertisement } from "@/lib/api";

export default function AdminProviderModelsPage() {
  const [ads, setAds] = useState<ProviderModelAdvertisement[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    listPendingProviderModels()
      .then((res) => setAds(res.provider_model_advertisements))
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function act(id: string, action: "approve" | "reject") {
    if (action === "reject" && !confirm("Reject this provider model advertisement?")) return;
    setError(null);
    setSuccess("");
    try {
      if (action === "approve") await approveProviderModel(id);
      if (action === "reject") await rejectProviderModel(id);
      setAds((items) => items.filter((item) => item.id !== id));
      setSuccess(action === "approve" ? "Provider model approved." : "Provider model rejected.");
    } catch (err) {
      setError(err);
    }
  }

  return (
    <Shell>
      <div className="stack">
        <h1>Pending Provider Models</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {success ? <SuccessMessage message={success} /> : null}
        {loading ? <Loading /> : null}
        {!loading && ads.length === 0 ? <Empty label="No pending provider model advertisements." /> : null}
        {ads.length > 0 ? (
          <table>
            <thead><tr><th>Runtime model</th><th>Provider</th><th>Runtime</th><th>Digest</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad.id}>
                  <td>{ad.runtime_model_name}<div className="muted">{ad.id}</div></td>
                  <td>{ad.provider_id}</td>
                  <td>{ad.runtime}</td>
                  <td>{ad.local_digest || "—"}</td>
                  <td>{new Date(ad.created_at).toLocaleString()}</td>
                  <td className="row">
                    <button className="button" type="button" onClick={() => act(ad.id, "approve")}>Approve</button>
                    <button className="button secondary" type="button" onClick={() => act(ad.id, "reject")}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </Shell>
  );
}
