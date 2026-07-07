"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading, SuccessMessage } from "@/components/State";
import { approveProvider, disableProvider, listAdminProviders, rejectProvider, type Provider } from "@/lib/api";

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    listAdminProviders()
      .then((res) => setProviders(res.providers))
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function act(providerID: string, action: "approve" | "reject" | "disable") {
    if (action !== "approve" && !confirm(`${action} this provider?`)) return;
    setError(null);
    setSuccess("");
    try {
      if (action === "approve") await approveProvider(providerID);
      if (action === "reject") await rejectProvider(providerID);
      if (action === "disable") await disableProvider(providerID);
      setSuccess(action === "approve" ? "Provider approved." : action === "reject" ? "Provider rejected." : "Provider disabled.");
      load();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <Shell>
      <div className="stack">
        <h1>Admin Providers</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {success ? <SuccessMessage message={success} /> : null}
        {loading ? <Loading /> : null}
        {!loading && providers.length === 0 ? <Empty label="No providers." /> : null}
        {providers.length > 0 ? (
          <div className="surface">
            <table>
              <thead><tr><th>Provider</th><th>Approval</th><th>Instance</th><th>Heartbeat</th><th>Models</th><th>Trust</th><th>Region</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.id}>
                    <td>{provider.name}<div className="muted">{provider.id}</div></td>
                    <td><StatusPill value={provider.approval_status} /></td>
                    <td>{provider.instance_status ? <StatusPill value={provider.instance_status} /> : <span className="muted">—</span>}</td>
                    <td>{provider.last_heartbeat_at ? new Date(provider.last_heartbeat_at).toLocaleString() : <span className="muted">—</span>}</td>
                    <td>{provider.model_names?.length > 0 ? provider.model_names.join(", ") : <span className="muted">—</span>}</td>
                    <td><StatusPill value={provider.trust_level} /></td>
                    <td>{provider.region_hint || "—"}</td>
                    <td>{new Date(provider.created_at).toLocaleString()}</td>
                    <td className="row">
                      {provider.approval_status !== "approved" ? <button className="button" type="button" onClick={() => act(provider.id, "approve")}>Approve</button> : null}
                      {provider.approval_status !== "rejected" ? <button className="button secondary" type="button" onClick={() => act(provider.id, "reject")}>Reject</button> : null}
                      {provider.status !== "disabled" ? <button className="button danger" type="button" onClick={() => act(provider.id, "disable")}>Disable</button> : null}
                    </td>
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
