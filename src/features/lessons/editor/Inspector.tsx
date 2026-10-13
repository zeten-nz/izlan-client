"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { apiUpload } from "@/lib/api";
import { cn } from "@/lib/cn";
import { assetUrl, BLANK_RE, STAGE_H, STAGE_W, type Align, type Block, type Blank, type ChoiceBlock, type FillBlankBlock, type Gate, type Page } from "../types";
import { fitBlock, uid } from "./ops";

export type Update = (f: (b: Block) => Block, key?: string) => void;

const input = "w-full border-[3px] border-ink bg-white px-2.5 py-1.5 text-[15px] font-medium outline-none focus:bg-acid/40";
const smallBtn = "border-[3px] border-ink bg-paper px-2.5 py-1 text-[13px] font-bold hover:bg-acid disabled:opacity-40";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          aria-pressed={value === o.v}
          className={cn("-ml-[3px] flex-1 border-[3px] border-ink px-2 py-1 text-[13px] font-bold first:ml-0", value === o.v ? "bg-ink text-paper" : "bg-white hover:bg-acid")}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

const ALIGN: { v: Align; l: string }[] = [
  { v: "left", l: "Chap" },
  { v: "center", l: "O'rta" },
  { v: "right", l: "O'ng" },
];

const BLOCK_NAMES: Record<Block["type"], string> = {
  heading: "Sarlavha",
  text: "Matn",
  callout: "Muhim blok",
  image: "Rasm",
  audio: "Audio",
  choice: "Test savoli",
  fillblank: "Bo'sh joyni to'ldirish",
};

type Props = {
  page: Page;
  block: Block | null;
  onUpdate: Update;
  onPage: (f: (p: Page) => Page, key?: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onZ: (dir: "front" | "back" | "up" | "down") => void;
  /** Ikki marta bosilganda asosiy matn maydoniga fokus */
  focusToken: number;
};

export function Inspector({ page, block, onUpdate, onPage, onDelete, onDuplicate, onZ, focusToken }: Props) {
  const mainRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => {
    if (focusToken > 0) mainRef.current?.focus();
  }, [focusToken]);

  if (!block) {
    return (
      <div className="space-y-4">
        <p className="label">Sahifa sozlamalari</p>
        <Field label="Sahifa nomi (ixtiyoriy)">
          <input className={input} value={page.title} maxLength={300} onChange={(e) => onPage((p) => ({ ...p, title: e.target.value }), `ptitle:${page.id}`)} />
        </Field>
        <Field label="Keyingi sahifaga o'tish sharti">
          <select className={input} value={page.gate} onChange={(e) => onPage((p) => ({ ...p, gate: e.target.value as Gate }))}>
            <option value="free">Erkin o&apos;tish</option>
            <option value="answered">Savollarga javob berilishi shart</option>
            <option value="correct">Savollarga to&apos;g&apos;ri javob shart</option>
          </select>
        </Field>
        <p className="text-sm leading-snug opacity-70">Shart bo&apos;lsa, o&apos;quvchi shu sahifadagi savol bloklariga javob bermaguncha keyingi sahifa unga ochilmaydi. Elementni tanlash uchun uni bosing.</p>
      </div>
    );
  }

  const set = <K extends string>(patch: Record<K, unknown>, key?: string) => onUpdate((b) => ({ ...b, ...patch }) as Block, key);
  const k = (f: string) => `${f}:${block.id}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="label">{BLOCK_NAMES[block.type]}</p>
        <div className="flex gap-1.5">
          <button type="button" className={smallBtn} onClick={onDuplicate} title="Nusxa (Ctrl+D)">
            Nusxa
          </button>
          <button type="button" className={cn(smallBtn, "hover:bg-tomato")} onClick={onDelete} title="O'chirish (Delete)">
            O&apos;chirish
          </button>
        </div>
      </div>

      {block.type === "heading" && (
        <>
          <Field label="Sarlavha">
            <input ref={mainRef} className={input} value={block.text} maxLength={300} onChange={(e) => set({ text: e.target.value }, k("text"))} />
          </Field>
          <Field label="Hajmi">
            <Seg value={String(block.level)} options={[{ v: "1", l: "Katta" }, { v: "2", l: "O'rta" }, { v: "3", l: "Kichik" }]} onChange={(v) => set({ level: Number(v) })} />
          </Field>
          <Field label="Joylashuvi">
            <Seg value={block.align} options={ALIGN} onChange={(v) => set({ align: v })} />
          </Field>
        </>
      )}

      {block.type === "text" && (
        <>
          <Field label="Matn">
            <textarea ref={mainRef} className={cn(input, "min-h-40")} value={block.text} maxLength={4000} onChange={(e) => set({ text: e.target.value }, k("text"))} />
          </Field>
          <p className="text-xs leading-snug opacity-70">
            Ro&apos;yxat: qatorni <b>- </b> bilan boshlang. Qalin: <b>**so&apos;z**</b>.
          </p>
          <Field label="Joylashuvi">
            <Seg value={block.align} options={ALIGN} onChange={(v) => set({ align: v })} />
          </Field>
        </>
      )}

      {block.type === "callout" && (
        <>
          <Field label="Matn">
            <textarea ref={mainRef} className={cn(input, "min-h-32")} value={block.text} maxLength={4000} onChange={(e) => set({ text: e.target.value }, k("text"))} />
          </Field>
          <Field label="Rangi">
            <Seg value={block.tone} options={[{ v: "info", l: "Ko'k" }, { v: "warning", l: "Sariq" }, { v: "success", l: "Yashil" }]} onChange={(v) => set({ tone: v })} />
          </Field>
        </>
      )}

      {block.type === "image" && (
        <>
          <Upload kind="image" assetId={block.assetId} onDone={(id, name) => onUpdate((b) => (b.type === "image" ? { ...b, assetId: id, alt: b.alt || name } : b))} />
          <Field label="Rasm tavsifi (alt) — ko'rmaydiganlar uchun">
            <input className={input} value={block.alt} maxLength={300} onChange={(e) => set({ alt: e.target.value }, k("alt"))} />
          </Field>
          <Field label="Sig'dirish">
            <Seg value={block.fit} options={[{ v: "contain", l: "To'liq ko'rsat" }, { v: "cover", l: "To'ldir" }]} onChange={(v) => set({ fit: v })} />
          </Field>
        </>
      )}

      {block.type === "audio" && (
        <>
          <Upload kind="audio" assetId={block.assetId} onDone={(id) => set({ assetId: id })} />
          <Field label="Izoh (audio ostida)">
            <input className={input} value={block.caption} maxLength={300} onChange={(e) => set({ caption: e.target.value }, k("caption"))} />
          </Field>
          <Field label="Matni (transkript, ixtiyoriy)">
            <textarea className={cn(input, "min-h-24")} value={block.transcript} maxLength={4000} onChange={(e) => set({ transcript: e.target.value }, k("tr"))} />
          </Field>
        </>
      )}

      {block.type === "choice" && <ChoiceFields block={block} set={set} k={k} mainRef={mainRef} />}
      {block.type === "fillblank" && <FillBlankFields block={block} set={set} k={k} mainRef={mainRef} />}

      <fieldset className="space-y-2 border-t-[3px] border-ink pt-3">
        <legend className="label -mt-5 bg-paper px-1">O&apos;rni va o&apos;lchami</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["x", "y", "w", "h"] as const).map((f) => (
            <label key={f} className="block">
              <span className="label block">{f === "w" ? "Eni" : f === "h" ? "Bo'yi" : f.toUpperCase()}</span>
              <input
                type="number"
                className={cn(input, "px-1.5")}
                min={0}
                max={f === "x" || f === "w" ? STAGE_W : STAGE_H}
                value={Math.round(block[f])}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) onUpdate((b) => fitBlock({ ...b, [f]: n }), `frame:${block.id}:${f}`);
                }}
              />
            </label>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {([["front", "Eng old"], ["up", "Oldinga"], ["down", "Orqaga"], ["back", "Eng orqa"]] as const).map(([d, l]) => (
            <button key={d} type="button" className={smallBtn} onClick={() => onZ(d)}>
              {l}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

type SetFn = <K extends string>(patch: Record<K, unknown>, key?: string) => void;

function ChoiceFields({ block, set, k, mainRef }: { block: ChoiceBlock; set: SetFn; k: (f: string) => string; mainRef: React.RefObject<(HTMLInputElement & HTMLTextAreaElement) | null> }) {
  const setOption = (id: string, text: string) => set({ options: block.options.map((o) => (o.id === id ? { ...o, text } : o)) }, k(`opt-${id}`));
  const toggleCorrect = (id: string) => {
    const has = block.correctIds.includes(id);
    set({ correctIds: block.multiple ? (has ? block.correctIds.filter((c) => c !== id) : [...block.correctIds, id]) : [id] });
  };
  return (
    <>
      <Field label="Savol">
        <textarea ref={mainRef} className={cn(input, "min-h-20")} value={block.question} maxLength={1000} onChange={(e) => set({ question: e.target.value }, k("q"))} />
      </Field>
      <div className="space-y-2">
        <span className="label block">Variantlar (to&apos;g&apos;risini belgilang)</span>
        {block.options.map((o) => (
          <div key={o.id} className="flex items-center gap-2">
            <input
              type={block.multiple ? "checkbox" : "radio"}
              name={`correct-${block.id}`}
              checked={block.correctIds.includes(o.id)}
              onChange={() => toggleCorrect(o.id)}
              aria-label="To'g'ri javob"
              className="size-5 shrink-0 accent-ink"
            />
            <input className={input} value={o.text} maxLength={300} onChange={(e) => setOption(o.id, e.target.value)} />
            <button
              type="button"
              className={cn(smallBtn, "shrink-0")}
              disabled={block.options.length <= 2}
              aria-label="Variantni o'chirish"
              onClick={() => set({ options: block.options.filter((x) => x.id !== o.id), correctIds: block.correctIds.filter((c) => c !== o.id) })}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className={smallBtn} disabled={block.options.length >= 6} onClick={() => set({ options: [...block.options, { id: uid("o"), text: "" }] })}>
          + Variant qo&apos;shish
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          className="size-5 accent-ink"
          checked={block.multiple}
          onChange={(e) => set({ multiple: e.target.checked, correctIds: e.target.checked ? block.correctIds : block.correctIds.slice(0, 1) })}
        />
        Bir nechta to&apos;g&apos;ri javob
      </label>
      <Field label="Izoh (javobdan keyin ko'rinadi)">
        <textarea className={cn(input, "min-h-16")} value={block.explanation} maxLength={1000} onChange={(e) => set({ explanation: e.target.value }, k("ex"))} />
      </Field>
    </>
  );
}

/** Shablondagi [[id]] lardan blanks ro'yxatini yig'adi; mavjudlarining javoblari saqlanadi. */
function syncBlanks(template: string, blanks: Blank[]): Blank[] {
  const ids = [...new Set([...template.matchAll(BLANK_RE)].map((m) => m[1]))];
  return ids.map((id) => blanks.find((b) => b.id === id) ?? { id, answers: [""], caseSensitive: false });
}

function FillBlankFields({ block, set, k, mainRef }: { block: FillBlankBlock; set: SetFn; k: (f: string) => string; mainRef: React.RefObject<(HTMLInputElement & HTMLTextAreaElement) | null> }) {
  const nextId = () => {
    let n = block.blanks.length + 1;
    while (block.blanks.some((b) => b.id === String(n))) n++;
    return String(n);
  };
  const setBlank = (id: string, patch: Partial<Blank>, key?: string) => set({ blanks: block.blanks.map((b) => (b.id === id ? { ...b, ...patch } : b)) }, key);
  return (
    <>
      <Field label="Matn (bo'sh joy: [[1]], [[2]]…)">
        <textarea
          ref={mainRef}
          className={cn(input, "min-h-24")}
          value={block.template}
          maxLength={1500}
          onChange={(e) => set({ template: e.target.value, blanks: syncBlanks(e.target.value, block.blanks) }, k("tpl"))}
        />
      </Field>
      <button
        type="button"
        className={smallBtn}
        disabled={block.blanks.length >= 12}
        onClick={() => {
          const id = nextId();
          const template = `${block.template}${block.template && !block.template.endsWith(" ") ? " " : ""}[[${id}]]`;
          set({ template, blanks: syncBlanks(template, block.blanks) });
        }}
      >
        + Bo&apos;sh joy qo&apos;shish
      </button>
      {block.blanks.map((b) => (
        <div key={b.id} className="space-y-1.5 border-[3px] border-ink bg-white p-2.5">
          <Field label={`[[${b.id}]] — to'g'ri javob(lar), vergul bilan`}>
            <input
              className={input}
              value={b.answers.join(", ")}
              onChange={(e) => setBlank(b.id, { answers: e.target.value.split(",").map((s) => s.trimStart()) }, k(`bl-${b.id}`))}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="size-5 accent-ink" checked={b.caseSensitive} onChange={(e) => setBlank(b.id, { caseSensitive: e.target.checked })} />
            Bosh/kichik harf farqlansin
          </label>
        </div>
      ))}
      <Field label="Izoh (javobdan keyin ko'rinadi)">
        <textarea className={cn(input, "min-h-16")} value={block.explanation} maxLength={1000} onChange={(e) => set({ explanation: e.target.value }, k("ex"))} />
      </Field>
    </>
  );
}

function Upload({ kind, assetId, onDone }: { kind: "image" | "audio"; assetId: string | null; onDone: (id: string, name: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    const r = await apiUpload<{ id: string; name: string }>("/assets", file);
    setBusy(false);
    if (ref.current) ref.current.value = "";
    if (r.ok) onDone(r.data.id, r.data.name.replace(/\.[^.]+$/, ""));
    else setErr(r.message);
  };
  return (
    <div className="space-y-2">
      <span className="label block">{kind === "image" ? "Rasm" : "Audio"}</span>
      {assetId && kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element -- ustoz yuklagan rasm
        <img src={assetUrl(assetId)} alt="" className="max-h-32 border-[3px] border-ink bg-paper-2 object-contain" />
      ) : null}
      {assetId && kind === "audio" ? <audio controls src={assetUrl(assetId)} className="w-full" /> : null}
      <input
        ref={ref}
        type="file"
        hidden
        accept={kind === "image" ? "image/png,image/jpeg,image/webp,image/gif" : "audio/mpeg,audio/mp4,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav"}
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <button type="button" className={cn(smallBtn, "w-full py-2")} disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? "Yuklanmoqda…" : assetId ? "Almashtirish" : "Fayl tanlash"}
      </button>
      <p className="text-xs opacity-70">{kind === "image" ? "PNG, JPG, WEBP, GIF · 5 MB gacha" : "MP3, M4A, OGG, WAV · 15 MB gacha"}</p>
      {err ? (
        <p role="alert" className="border-[3px] border-ink bg-tomato p-2 text-sm font-semibold">
          {err}
        </p>
      ) : null}
    </div>
  );
}
