"use client";

import { FormEvent, useEffect, useState } from "react";
import { CopyBox } from "@/components/CopyBox";
import { CreditNotice } from "@/components/CreditNotice";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading } from "@/components/State";
import { createProvider, listProviders, type Provider } from "@/lib/api";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [allowPull, setAllowPull] = useState(false);
  const [token, setToken] = useState("");
  const [setupCommands, setSetupCommands] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listProviders()
      .then((res) => setProviders(res.providers))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setToken("");
    setSetupCommands("");
    try {
      const providerName = name;
      const res = await createProvider(providerName, region.trim() || null, allowPull);
      setProviders((items) => [res.provider, ...items]);
      setToken(res.plaintext_token);
      setSetupCommands(`nuvonode-provider init --server http://localhost:18080 --token ${res.plaintext_token} --name "${providerName}"
nuvonode-provider doctor
nuvonode-provider serve`);
      setName("");
      setRegion("");
      setAllowPull(false);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <div className="stack">
        <h1>Providers</h1>
        <CreditNotice />
        <PrivacyNotice />
        <form className="card stack" onSubmit={submit}>
          <h2>Create provider</h2>
          <div className="field">
            <label htmlFor="provider-name">Name</label>
            <input id="provider-name" required value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="region">Region hint</label>
            <input id="region" value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Optional" />
          </div>
          <label className="row">
            <input checked={allowPull} type="checkbox" onChange={(event) => setAllowPull(event.target.checked)} />
            Allow provider node to pull missing local Ollama models when supported
          </label>
          <button className="button" disabled={saving} type="submit">{saving ? "Creating..." : "Create provider"}</button>
        </form>
        {error ? <ErrorMessage error={error} /> : null}
        {token ? <div className="notice warn stack"><strong>Copy this provider token now. It will not be shown again.</strong><CopyBox value={token} /><CopyBox value={setupCommands} /></div> : null}
        {loading ? <Loading /> : null}
        {!loading && providers.length === 0 ? <Empty label="No providers yet." /> : null}
        {providers.length > 0 ? (
          <table>
            <thead><tr><th>Name</th><th>Approval</th><th>Status</th><th>Trust</th><th>Region</th><th>Created</th></tr></thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.id}>
                  <td>{provider.name}<div className="muted">{provider.id}</div></td>
                  <td>{provider.approval_status}</td>
                  <td>{provider.status}</td>
                  <td>{provider.trust_level}</td>
                  <td>{provider.region_hint || "—"}</td>
                  <td>{new Date(provider.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </Shell>
  );
}
