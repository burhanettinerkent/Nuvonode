"use client";

import { FormEvent, useEffect, useState } from "react";
import { CopyBox } from "@/components/CopyBox";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading, SuccessMessage } from "@/components/State";
import { createAPIKey, listAPIKeys, listProjects, revokeAPIKey, type APIKey, type Project } from "@/lib/api";

export default function APIKeysPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectID, setProjectID] = useState("");
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [name, setName] = useState("");
  const [plaintextKey, setPlaintextKey] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listProjects()
      .then((res) => {
        setProjects(res.projects);
        setProjectID(res.projects[0]?.id || "");
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!projectID) {
      setKeys([]);
      return;
    }
    setLoading(true);
    listAPIKeys(projectID)
      .then((res) => setKeys(res.api_keys))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [projectID]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess("");
    setPlaintextKey("");
    try {
      const res = await createAPIKey(projectID, name);
      setKeys((items) => [res.api_key, ...items]);
      setPlaintextKey(res.plaintext_key);
      setSuccess("API key created. Copy it now; it cannot be shown again.");
      setName("");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  async function revoke(keyID: string) {
    if (!confirm("Revoke this API key? Existing clients using it will stop working.")) return;
    setError(null);
    setSuccess("");
    try {
      await revokeAPIKey(projectID, keyID);
      setKeys((items) => items.map((key) => key.id === keyID ? { ...key, status: "revoked" } : key));
      setSuccess("API key revoked.");
    } catch (err) {
      setError(err);
    }
  }

  return (
    <Shell>
      <div className="stack">
        <h1>API Keys</h1>
        {error ? <ErrorMessage error={error} /> : null}
        {success ? <SuccessMessage message={success} /> : null}
        {loading ? <Loading /> : null}
        {!loading && projects.length === 0 ? <Empty label="Create a project before creating API keys." /> : null}
        {projects.length > 0 ? (
          <>
            <div className="card stack">
              <div className="field">
                <label htmlFor="project">Project</label>
                <select id="project" value={projectID} onChange={(event) => setProjectID(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </div>
              <form className="stack" onSubmit={submit}>
                <div className="field">
                  <label htmlFor="key-name">Key name</label>
                  <input id="key-name" required value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <button className="button" disabled={saving || !projectID} type="submit">{saving ? "Creating..." : "Create API key"}</button>
              </form>
            </div>
            {plaintextKey ? <div className="notice warn stack"><strong>Copy this key now. It will not be shown again.</strong><CopyBox value={plaintextKey} /></div> : null}
            {keys.length === 0 ? <Empty label="No API keys for this project." /> : (
              <div className="surface">
                <table>
                  <thead><tr><th>Name</th><th>Prefix</th><th>Status</th><th>Created</th><th></th></tr></thead>
                  <tbody>
                    {keys.map((key) => (
                      <tr key={key.id}>
                        <td>{key.name}<div className="muted">{key.id}</div></td>
                        <td>{key.prefix}</td>
                        <td><StatusPill value={key.status} /></td>
                        <td>{new Date(key.created_at).toLocaleString()}</td>
                        <td>{key.status === "active" ? <button className="button danger" type="button" onClick={() => revoke(key.id)}>Revoke</button> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </div>
    </Shell>
  );
}
