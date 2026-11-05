"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGetJson, apiPost, apiSend } from "@/lib/api";
import { Field, LoadState, inputCls, primaryBtn, smallBtn } from "@/features/notebook/ui";
import { CosmeticThumb, DESIGNS, designsOfKind, type DesignKey } from "./designs";
import { RarityTag } from "./identity";
import { KINDS, KIND_LABEL, RARITIES, RARITY_LABEL, type Cosmetic, type CosmeticKind, type Rarity } from "./types";

type Row = Cosmetic & {
  status: "DRAFT" | "ACTIVE" | "DISABLED";
  recommended?: { min: number; max: number };
  priceInRange?: boolean | null;
  purchases?: number;
};

const STATUS_LABEL = { DRAFT: "Qoralama", ACTIVE: "Faol", DISABLED: "To'xtatilgan" } as const;
const EMPTY = { slug: "", name: "", description: "", kind: "FRAME" as CosmeticKind, rarity: "COMMON" as Rarity, previewKey: "" as DesignKey | "", season: "" };

/** Tayyor dizayn tanlash + saqlashdan oldin preview. Faqat tasdiqlangan registrdan tanlanadi. */
function DesignPicker({ kind, value, onChange, name, rarity }: { kind: CosmeticKind; value: DesignKey | ""; onChange: (k: DesignKey | "") => void; name: string; rarity: Rarity }) {
  const options = designsOfKind(kind);
  const pseudo: Cosmetic = {
    id: "preview",
    slug: "preview",
    kind,
    rarity,
    name: name || (value ? DESIGNS[value].label : "Preview"),
    description: "",
    priceXp: null,
    preview: value ? { key: value } : null,
    season: null,
  };
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
      <Field label="Tayyor dizayn">
        <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as DesignKey | "")}>
          <option value="">— tanlanmagan —</option>
          {options.map((k) => (
            <option key={k} value={k}>
              {DESIGNS[k].label}
            </option>
          ))}
        </select>
      </Field>
      <div>
        <p className="label mb-1">Preview</p>
        <CosmeticThumb item={pseudo} initials="IZ" />
      </div>
    </div>
  );
}

function RowEditor({ row, busy, onSave }: { row: Row; busy: boolean; onSave: (patch: Record<string, unknown>) => Promise<void> }) {
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description);
  const [rarity, setRarity] = useState<Rarity>(row.rarity);
  const [key, setKey] = useState<DesignKey | "">((row.preview?.key as DesignKey | undefined) ?? "");
  const [price, setPrice] = useState(row.priceXp === null ? "" : String(row.priceXp));
  const rec = row.recommended;
  const n = price.trim() === "" ? null : Number(price);
  const invalid = n !== null && (!Number.isInteger(n) || n <= 0);
  const outside = n !== null && !invalid && rec ? n < rec.min || n > rec.max : false;
  return (
    <div className="mt-3 w-full space-y-3 border-t-[3px] border-ink pt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nomi">
          <input className={inputCls} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Noyoblik">
          <select className={inputCls} value={rarity} onChange={(e) => setRarity(e.target.value as Rarity)}>
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {RARITY_LABEL[r]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Tavsif">
        <input className={inputCls} value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <DesignPicker kind={row.kind} value={key} onChange={setKey} name={name} rarity={rarity} />
      <Field label="Narx (XP)" hint={rec ? `Tavsiya (${RARITY_LABEL[row.rarity]}): ${rec.min}–${rec.max} XP. Bo'sh = narx belgilanmagan` : "Bo'sh = narx belgilanmagan"}>
        <input className={inputCls} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} placeholder="masalan, 250" />
      </Field>
      {(row.purchases ?? 0) > 0 && (
        <p className="text-sm text-ink/75">Bu bezak {row.purchases} marta sotib olingan: narx o&apos;zgarsa avvalgi xaridlar va egalik o&apos;zgarmaydi.</p>
      )}
      {invalid && <p role="alert" className="label border-2 border-ink bg-tomato px-2 py-1 text-paper">Narx noldan katta butun son bo&apos;lsin</p>}
      {outside && rec && (
        <p role="status" className="label border-2 border-ink bg-bubble px-2 py-1 [overflow-wrap:anywhere]">
          Ogohlantirish: {n} XP tavsiya diapazonidan ({rec.min}–{rec.max}) tashqarida. Saqlash mumkin.
        </p>
      )}
      <button
        type="button"
        className={primaryBtn}
        disabled={busy || !name.trim() || invalid}
        onClick={() => onSave({ name, description, rarity, priceXp: n, ...(key && { previewKey: key }) })}
      >
        Saqlash
      </button>
    </div>
  );
}

/** Admin: bezaklar katalogi. O'chirish yo'q: to'xtatilgan bezak egalarida qoladi. Sotish/XP yechish bu yerda yo'q. */
export function CosmeticsManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [formErr, setFormErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await apiGetJson<Row[]>("/admin/cosmetics");
    if (r.ok) {
      setRows(r.data);
      setStatus("ready");
    } else {
      setError(r.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    apiGetJson<Row[]>("/admin/cosmetics").then((r) => {
      if (r.ok) {
        setRows(r.data);
        setStatus("ready");
      } else {
        setError(r.message);
        setStatus("error");
      }
    });
  }, []);

  async function create() {
    setBusy(true);
    setFormErr("");
    const r = await apiPost("/admin/cosmetics", {
      slug: form.slug,
      name: form.name,
      description: form.description,
      kind: form.kind,
      rarity: form.rarity,
      ...(form.previewKey && { previewKey: form.previewKey }),
      ...(form.season && { season: form.season }),
    });
    setBusy(false);
    if (r.ok) {
      setForm(EMPTY);
      await load();
    } else setFormErr(Object.values(r.fieldErrors)[0] ?? r.message);
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    setFormErr("");
    const r = await apiSend("PATCH", `/admin/cosmetics/${id}`, body);
    setBusy(false);
    if (r.ok) {
      setEditing(null);
      await load();
    } else setFormErr(r.message);
  }

  return (
    <div className="space-y-8">
      <section className="border-[3px] border-ink bg-white p-4 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-6" aria-label="Yangi bezak">
        <h2 className="display-cond text-2xl">Yangi bezak (qoralama)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nomi">
            <input className={inputCls} value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Slug" hint="kichik harf, raqam va chiziqcha">
            <input className={inputCls} value={form.slug} maxLength={60} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </Field>
          <Field label="Turi">
            <select className={inputCls} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as CosmeticKind, previewKey: "" })}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Noyoblik">
            <select className={inputCls} value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value as Rarity })}>
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {RARITY_LABEL[r]}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <DesignPicker kind={form.kind} value={form.previewKey} onChange={(k) => setForm({ ...form, previewKey: k })} name={form.name} rarity={form.rarity} />
            {form.kind === "EFFECT" && <p className="mt-1 text-sm text-ink/70">Effekt dizaynlari hali yo&apos;q.</p>}
          </div>
          <Field label="Mavsum (ixtiyoriy)">
            <input className={inputCls} value={form.season} maxLength={60} onChange={(e) => setForm({ ...form, season: e.target.value })} />
          </Field>
          <Field label="Tavsif">
            <input className={inputCls} value={form.description} maxLength={300} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <p className="mt-3 text-sm text-ink/70">Narx hozircha belgilanmaydi (bo&apos;sh qoladi).</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className={primaryBtn} disabled={busy || !form.slug || !form.name} onClick={create}>
            Qo&apos;shish
          </button>
          {formErr && (
            <p role="alert" className="label border-2 border-ink bg-tomato px-2 py-1 text-paper">
              {formErr}
            </p>
          )}
        </div>
      </section>

      <section aria-label="Bezaklar ro'yxati">
        <LoadState
          status={status}
          error={error}
          onRetry={() => {
            setStatus("loading");
            void load();
          }}
        />
        {status === "ready" && rows.length === 0 && <p className="border-[3px] border-dashed border-ink bg-white p-6">Hali bezak yo&apos;q.</p>}
        {status === "ready" && rows.length > 0 && (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-[3px] border-ink bg-white p-4">
                <div className="min-w-0">
                  <p className="font-display text-lg font-black [overflow-wrap:anywhere]">{r.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="label">{KIND_LABEL[r.kind]}</span>
                    <RarityTag rarity={r.rarity} />
                    <span className="label border-2 border-ink px-2 py-0.5">{STATUS_LABEL[r.status]}</span>
                    <span className="label">{r.priceXp === null ? "Narx yo'q" : `${r.priceXp} XP`}</span>
                    {r.priceInRange === false && <span className="label border-2 border-ink bg-bubble px-1.5 py-0.5">Diapazondan tashqari</span>}
                    <span className="font-mono text-xs text-ink/60">{r.slug}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={smallBtn} aria-expanded={editing === r.id} onClick={() => setEditing(editing === r.id ? null : r.id)}>
                    Tahrirlash
                  </button>
                  {r.status !== "ACTIVE" && (
                    <button
                      type="button"
                      className={smallBtn}
                      disabled={busy || !r.preview?.key}
                      title={r.preview?.key ? undefined : "Dizayn tanlanmagan"}
                      onClick={() => patch(r.id, { status: "ACTIVE" })}
                    >
                      Faollashtirish
                    </button>
                  )}
                  {r.status === "ACTIVE" && (
                    <button type="button" className={smallBtn} disabled={busy} onClick={() => patch(r.id, { status: "DISABLED" })}>
                      To&apos;xtatish
                    </button>
                  )}
                </div>
                {editing === r.id && <RowEditor row={r} busy={busy} onSave={(b) => patch(r.id, b)} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
