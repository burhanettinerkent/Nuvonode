"use client";

import { FormEvent, useEffect, useState } from "react";
import { StatusPill } from "@/components/Display";
import { Shell } from "@/components/Shell";
import { Empty, ErrorMessage, Loading, SuccessMessage } from "@/components/State";
import { createAdminModel, listAdminModels, pauseAdminModel, updateAdminModel, type Model, type ModelPayload } from "@/lib/api";

type ModelForm = {
  slug: string;
  displayName: string;
  description: string;
  family: string;
  status: string;
  contextLength: string;
  defaultMaxOutputTokens: string;
  inputCreditPer1K: string;
  outputCreditPer1K: string;
  providerRewardRatio: string;
  minVramMB: string;
  recommendedVramMB: string;
  licenseName: string;
  licenseURL: string;
  licenseNotes: string;
  communityAllowed: boolean;
};

const defaultForm: ModelForm = {
  slug: "",
  displayName: "",
  description: "",
  family: "",
  status: "active",
  contextLength: "4096",
  defaultMaxOutputTokens: "1024",
  inputCreditPer1K: "10",
  outputCreditPer1K: "20",
  providerRewardRatio: "0.7",
  minVramMB: "8192",
  recommendedVramMB: "12288",
  licenseName: "unknown",
  licenseURL: "",
  licenseNotes: "",
  communityAllowed: true,
};

function numberValue(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error("Geçerli sayısal model alanları gir.");
  return parsed;
}

function modelPayload(form: ModelForm): ModelPayload {
  return {
    slug: form.slug,
    display_name: form.displayName,
    description: form.description,
    family: form.family,
    modality: "text",
    status: form.status,
    context_length: numberValue(form.contextLength),
    default_max_output_tokens: numberValue(form.defaultMaxOutputTokens),
    input_credit_per_1k: numberValue(form.inputCreditPer1K),
    output_credit_per_1k: numberValue(form.outputCreditPer1K),
    provider_reward_ratio: numberValue(form.providerRewardRatio),
    min_vram_mb: numberValue(form.minVramMB),
    recommended_vram_mb: numberValue(form.recommendedVramMB),
    license_name: form.licenseName,
    license_url: form.licenseURL.trim() || null,
    license_notes: form.licenseNotes,
    community_allowed: form.communityAllowed,
    external_only: false,
  };
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [form, setForm] = useState<ModelForm>(defaultForm);
  const [editingID, setEditingID] = useState("");
  const [editingStatus, setEditingStatus] = useState("active");
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    listAdminModels()
      .then((res) => setModels(res.models))
      .catch(setError)
      .finally(() => setLoading(false));
  }

  function setField<K extends keyof ModelForm>(key: K, value: ModelForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(load, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess("");
    try {
      const payload = modelPayload(form);
      if ((payload.recommended_vram_mb ?? 0) < (payload.min_vram_mb ?? 0)) {
        throw new Error("Önerilen VRAM, minimum VRAM değerinden küçük olamaz.");
      }
      const res = await createAdminModel(payload);
      setModels((items) => [res.model, ...items]);
      setForm(defaultForm);
      setSuccess("Model oluşturuldu.");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  async function saveStatus() {
    if (!editingID) return;
    setError(null);
    setSuccess("");
    try {
      const res = await updateAdminModel(editingID, { status: editingStatus });
      setModels((items) => items.map((item) => item.id === editingID ? res.model : item));
      setEditingID("");
      setSuccess("Model durumu güncellendi.");
    } catch (err) {
      setError(err);
    }
  }

  async function pause(id: string) {
    if (!confirm("Bu modeli duraklatmak istiyor musun? Yeni yönlendirmeler durur.")) return;
    setError(null);
    setSuccess("");
    try {
      await pauseAdminModel(id);
      setModels((items) => items.map((item) => item.id === id ? { ...item, status: "paused" } : item));
      setSuccess("Model duraklatıldı.");
    } catch (err) {
      setError(err);
    }
  }

  return (
    <Shell>
      <div className="stack">
        <h1>Modeller</h1>
        <form className="card stack" onSubmit={submit}>
          <h2>Model oluştur</h2>
          <div className="grid">
            <div className="field"><label htmlFor="slug">Slug</label><input id="slug" required value={form.slug} onChange={(event) => setField("slug", event.target.value)} /></div>
            <div className="field"><label htmlFor="display-name">Görünen ad</label><input id="display-name" required value={form.displayName} onChange={(event) => setField("displayName", event.target.value)} /></div>
            <div className="field"><label htmlFor="family">Aile</label><input id="family" required value={form.family} onChange={(event) => setField("family", event.target.value)} /></div>
            <div className="field"><label htmlFor="status">Durum</label><select id="status" value={form.status} onChange={(event) => setField("status", event.target.value)}><option value="active">Aktif</option><option value="paused">Duraklatıldı</option><option value="deprecated">Eski</option></select></div>
            <div className="field"><label htmlFor="context-length">Bağlam uzunluğu</label><input id="context-length" min="1" required type="number" value={form.contextLength} onChange={(event) => setField("contextLength", event.target.value)} /></div>
            <div className="field"><label htmlFor="default-output">Varsayılan çıktı sınırı</label><input id="default-output" min="1" required type="number" value={form.defaultMaxOutputTokens} onChange={(event) => setField("defaultMaxOutputTokens", event.target.value)} /></div>
            <div className="field"><label htmlFor="input-credit">Giriş kredisi / 1K</label><input id="input-credit" min="0" required type="number" value={form.inputCreditPer1K} onChange={(event) => setField("inputCreditPer1K", event.target.value)} /></div>
            <div className="field"><label htmlFor="output-credit">Çıkış kredisi / 1K</label><input id="output-credit" min="0" required type="number" value={form.outputCreditPer1K} onChange={(event) => setField("outputCreditPer1K", event.target.value)} /></div>
            <div className="field"><label htmlFor="reward-ratio">Node payı oranı</label><input id="reward-ratio" max="1" min="0" required step="0.01" type="number" value={form.providerRewardRatio} onChange={(event) => setField("providerRewardRatio", event.target.value)} /></div>
            <div className="field"><label htmlFor="min-vram">Minimum VRAM MB</label><input id="min-vram" min="0" required type="number" value={form.minVramMB} onChange={(event) => setField("minVramMB", event.target.value)} /></div>
            <div className="field"><label htmlFor="recommended-vram">Önerilen VRAM MB</label><input id="recommended-vram" min="0" required type="number" value={form.recommendedVramMB} onChange={(event) => setField("recommendedVramMB", event.target.value)} /></div>
            <div className="field"><label htmlFor="license-name">Lisans adı</label><input id="license-name" required value={form.licenseName} onChange={(event) => setField("licenseName", event.target.value)} /></div>
            <div className="field"><label htmlFor="license-url">Lisans bağlantısı</label><input id="license-url" type="url" value={form.licenseURL} onChange={(event) => setField("licenseURL", event.target.value)} /></div>
          </div>
          <div className="field"><label htmlFor="description">Açıklama</label><textarea id="description" value={form.description} onChange={(event) => setField("description", event.target.value)} /></div>
          <div className="field"><label htmlFor="license-notes">Lisans notları</label><textarea id="license-notes" value={form.licenseNotes} onChange={(event) => setField("licenseNotes", event.target.value)} /></div>
          <label className="row"><input checked={form.communityAllowed} type="checkbox" onChange={(event) => setField("communityAllowed", event.target.checked)} /> Topluluk node'larına izin ver</label>
          <button className="button" disabled={saving} type="submit">{saving ? "Oluşturuluyor..." : "Model oluştur"}</button>
        </form>
        <div className="card row">
          <select value={editingID} onChange={(event) => {
            const id = event.target.value;
            setEditingID(id);
            setEditingStatus(models.find((model) => model.id === id)?.status || "active");
          }}>
            <option value="">Durumu güncellenecek modeli seç</option>
            {models.map((model) => <option key={model.id} value={model.id}>{model.slug}</option>)}
          </select>
          <select value={editingStatus} onChange={(event) => setEditingStatus(event.target.value)}>
            <option value="active">Aktif</option><option value="paused">Duraklatıldı</option><option value="deprecated">Eski</option>
          </select>
          <button className="button secondary" disabled={!editingID} type="button" onClick={saveStatus}>Durumu güncelle</button>
        </div>
        {error ? <ErrorMessage error={error} /> : null}
        {success ? <SuccessMessage message={success} /> : null}
        {loading ? <Loading label="Modeller yükleniyor..." /> : null}
        {!loading && models.length === 0 ? <Empty label="Henüz model yok." /> : null}
        {models.length > 0 ? (
          <div className="surface">
            <table>
              <thead><tr><th>Model</th><th>Durum</th><th>Aile</th><th>Bağlam</th><th>Kredi / 1K</th><th>Pay</th><th>VRAM</th><th>Topluluk</th><th>Lisans</th><th>İşlem</th></tr></thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id}>
                    <td><strong>{model.display_name}</strong><div className="muted">{model.slug}</div><div>{model.description}</div><div className="muted">{model.id}</div></td>
                    <td><StatusPill value={model.status} /></td>
                    <td>{model.family}<div className="muted">{model.modality}</div></td>
                    <td>{model.context_length}<div className="muted">varsayılan çıktı {model.default_max_output_tokens}</div></td>
                    <td>Giriş {model.input_credit_per_1k} / Çıkış {model.output_credit_per_1k}</td>
                    <td>{model.provider_reward_ratio}</td>
                    <td>{model.min_vram_mb} / {model.recommended_vram_mb} MB</td>
                    <td><StatusPill value={model.community_allowed ? "community_allowed" : "community_blocked"} /></td>
                    <td>{model.license_name}<div className="muted">{model.license_notes || model.license_url || "—"}</div></td>
                    <td>{model.status !== "paused" ? <button className="button secondary" type="button" onClick={() => pause(model.id)}>Duraklat</button> : <span className="pill warn">Duraklatıldı</span>}</td>
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
