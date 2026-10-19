"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RuleSections } from "@/features/grammar/components/RuleSections";
import { Field, inputCls, primaryBtn, smallBtn } from "@/features/notebook/ui";
import type { PublicTranslation } from "@/lib/grammar/public-data";
import { cn } from "@/lib/cn";
import { fromContent, toContent, type BlockF, type FormState } from "./content-form";
import { gcall, STATUS_LABEL, type Issue, type LanguageCfg, type RevisionView, type RuleView } from "./gapi";

type Props = {
  rule: RuleView;
  revision: RevisionView;
  lang: LanguageCfg;
  /** Tasdiqlangan oldingi revision (farq ko'rsatish uchun, ixtiyoriy) */
  role: "TEACHER" | "ADMIN";
  base: string;
};

const STATUS_STYLE: Record<RevisionView["status"], string> = {
  DRAFT: "bg-white",
  IN_REVIEW: "bg-acid",
  CHANGES_REQUESTED: "bg-tomato",
  REJECTED: "bg-ink text-paper",
  APPROVED: "bg-cobalt text-paper",
};

function toPreview(f: FormState, revisionNo: number): PublicTranslation {
  const c = toContent(f) as Record<string, unknown>;
  return {
    title: (c.title as string) || "(sarlavhasiz)",
    summary: c.summary as string,
    revision: revisionNo,
    reviewedAt: "",
    reviewedByName: "(tekshirilmagan)",
    formulas: c.formulas as PublicTranslation["formulas"],
    examples: c.examples as PublicTranslation["examples"],
    exceptions: c.exceptions as PublicTranslation["exceptions"],
    commonMistakes: c.commonMistakes as PublicTranslation["commonMistakes"],
    blocks: c.blocks as PublicTranslation["blocks"],
    keywords: c.keywords as string[],
    sources: (c.sources as { title: string; url?: string; license?: string; attribution?: string }[]).map((s) => ({
      title: s.title,
      ...(s.url ? { url: s.url } : {}),
      ...(s.license ? { license: s.license } : {}),
      ...(s.attribution ? { note: s.attribution } : {}),
    })),
    body: c.body as string,
  };
}

function Group({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <fieldset className="border-[3px] border-ink bg-white p-4">
      <legend className="label bg-paper px-2">{title}</legend>
      <div className="space-y-4">{children}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </fieldset>
  );
}

function ListRow({ children, onRemove, label }: { children: ReactNode; onRemove: () => void; label: string }) {
  return (
    <div className="relative border-[3px] border-ink/30 p-3">
      <button type="button" onClick={onRemove} aria-label={`${label}ni o'chirish`} className={cn(smallBtn, "absolute right-2 top-2")}>
        ×
      </button>
      <div className="grid gap-3 pr-10 md:grid-cols-2">{children}</div>
    </div>
  );
}

export function RuleEditor({ rule, revision, lang, role, base }: Props) {
  const router = useRouter();
  const editable = revision.canEdit;
  const [form, setForm] = useState<FormState>(() => fromContent(revision.content));
  const [rev, setRev] = useState(revision.rev);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [meta, setMeta] = useState({ slug: rule.slug, category: rule.category, level: rule.level?.value ?? "" });
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const patch = (p: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
  };
  const preview = useMemo(() => {
    try {
      return toPreview(form, revision.revisionNo);
    } catch {
      return null;
    }
  }, [form, revision.revisionNo]);

  async function save(): Promise<boolean> {
    setBusy("save");
    setMsg(null);
    setIssues([]);
    const neverApproved = !rule.revisions.some((r) => r.approvedAt);
    const res = await gcall<{ rev: number }>("PUT", `/staff/grammar/manage/revisions/${revision.id}`, {
      rev,
      content: toContent(form),
      ...(neverApproved
        ? { meta: { slug: meta.slug, category: meta.category, ...(lang.levelSystem !== "none" ? { level: meta.level ? { system: lang.levelSystem, value: meta.level } : null } : {}) } }
        : {}),
    });
    setBusy(null);
    if (res.ok) {
      setRev(res.data.rev);
      setDirty(false);
      setMsg({ tone: "ok", text: "Saqlandi" });
      return true;
    }
    setIssues(res.issues);
    setMsg({ tone: "err", text: res.status === 409 ? `${res.message}` : res.message });
    return false;
  }

  async function act(kind: "submit" | "withdraw") {
    if (kind === "submit" && dirty && !(await save())) return;
    setBusy(kind);
    setMsg(null);
    setIssues([]);
    const res = await gcall("POST", `/staff/grammar/manage/revisions/${revision.id}/${kind}`);
    setBusy(null);
    if (res.ok) {
      setDirty(false);
      router.refresh();
      setMsg({ tone: "ok", text: kind === "submit" ? "Tekshiruvga yuborildi" : "Qoralamaga qaytarildi" });
    } else {
      setIssues(res.issues);
      setMsg({ tone: "err", text: res.message });
    }
  }

  async function remove() {
    const reason = window.prompt("O'chirish sababi (kamida 3 belgi):");
    if (!reason || reason.trim().length < 3) return;
    setBusy("delete");
    const res = await gcall("DELETE", `/staff/grammar/manage/rules/${rule.id}`, { reason });
    setBusy(null);
    if (res.ok) {
      setDirty(false);
      router.push(base);
    } else setMsg({ tone: "err", text: res.message });
  }

  const input = (value: string, onChange: (v: string) => void, extra: { placeholder?: string; lang?: string; multiline?: boolean; rows?: number } = {}) =>
    extra.multiline ? (
      <textarea className={inputCls} rows={extra.rows ?? 3} value={value} disabled={!editable} lang={extra.lang} placeholder={extra.placeholder} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input className={inputCls} value={value} disabled={!editable} lang={extra.lang} placeholder={extra.placeholder} onChange={(e) => onChange(e.target.value)} />
    );

  const hasStress = lang.scripts.includes("Cyrl");
  const hasRuby = lang.scripts.includes("Jpan");
  const catTitle = (id: string) => lang.categories.find((c) => c.id === id)?.title.uz ?? id;

  return (
    <div data-testid="rule-editor">
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn("label border-[3px] border-ink px-2.5 py-1.5", STATUS_STYLE[revision.status])} data-testid="rev-status">
          {STATUS_LABEL[revision.status]}
        </span>
        <span className="label">{rule.id} · {rule.lang} · v{revision.revisionNo}</span>
        {revision.selfApproved && <span className="label border-[3px] border-ink bg-tomato px-2 py-1">o&apos;zi tasdiqlagan</span>}
        {rule.hidden && <span className="label border-[3px] border-ink bg-ink px-2 py-1 text-paper">yashirilgan</span>}
        {rule.state === "RETIRED" && <span className="label border-[3px] border-ink bg-ink px-2 py-1 text-paper">nafaqada</span>}
        {dirty && <span className="label text-tomato">saqlanmagan o&apos;zgarishlar</span>}
      </div>

      {revision.status === "CHANGES_REQUESTED" && revision.reviewNote && (
        <div role="note" className="mt-4 border-[3px] border-ink bg-tomato/30 p-4" data-testid="feedback">
          <p className="label">Admin izohi — tuzatish kerak</p>
          <p className="mt-1 whitespace-pre-wrap text-lg">{revision.reviewNote}</p>
        </div>
      )}
      {revision.status === "REJECTED" && revision.reviewNote && (
        <div role="note" className="mt-4 border-[3px] border-ink bg-white p-4">
          <p className="label">Rad etildi</p>
          <p className="mt-1 whitespace-pre-wrap text-lg">{revision.reviewNote}</p>
        </div>
      )}
      {!editable && (
        <p className="mt-4 border-[3px] border-dashed border-ink bg-white p-3 text-base" data-testid="readonly-note">
          {revision.status === "APPROVED"
            ? "Tasdiqlangan versiya o'zgarmas. O'zgartirish uchun Admin yangi revision ochadi."
            : revision.status === "IN_REVIEW"
              ? "Tekshiruvda: kontent muzlatilgan."
              : "Bu qoidani faqat o'qish mumkin (muallif siz emassiz yoki holat tahrirga yo'l bermaydi)."}
        </p>
      )}

      <div role="tablist" aria-label="Ko'rinish" className="mt-6 flex gap-2 lg:hidden">
        {(["edit", "preview"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn(smallBtn, tab === t && "bg-ink text-paper")}>
            {t === "edit" ? "Tahrir" : "Ko'rinish"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <form className={cn("space-y-6", tab === "preview" && "hidden lg:block")} onSubmit={(e) => { e.preventDefault(); void save(); }} aria-label="Qoida muharriri">
          <Group title="Asosiy">
            <Field label="Sarlavha (o'zbekcha)">{input(form.title, (v) => patch({ title: v }))}</Field>
            <Field label="Qisqa tavsif" hint="1–2 gap, 400 belgigacha">{input(form.summary, (v) => patch({ summary: v }), { multiline: true, rows: 3 })}</Field>
            {!rule.revisions.some((r) => r.approvedAt) && (
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Slug">
                  <input className={inputCls} value={meta.slug} disabled={!editable} onChange={(e) => { setMeta({ ...meta, slug: e.target.value }); setDirty(true); }} />
                </Field>
                <Field label="Kategoriya">
                  <select className={inputCls} value={meta.category} disabled={!editable} onChange={(e) => { setMeta({ ...meta, category: e.target.value }); setDirty(true); }}>
                    {lang.categories.map((c) => <option key={c.id} value={c.id}>{catTitle(c.id)}</option>)}
                  </select>
                </Field>
                {lang.levelSystem !== "none" && (
                  <Field label="Daraja">
                    <select className={inputCls} value={meta.level} disabled={!editable} onChange={(e) => { setMeta({ ...meta, level: e.target.value }); setDirty(true); }}>
                      <option value="">—</option>
                      {(lang.levelSystem === "jlpt" ? ["N5", "N4", "N3", "N2", "N1"] : ["A1", "A2", "B1", "B2", "C1", "C2"]).map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </Field>
                )}
              </div>
            )}
          </Group>

          <Group title="Tushuntirish (cheklangan markdown)">
            <Field label="Matn" hint="**qalin**, ro'yxat, jadval, <Callout tone=&quot;info&quot;>. JS, HTML, rasm taqiqlangan.">
              {input(form.body, (v) => patch({ body: v }), { multiline: true, rows: 10 })}
            </Field>
          </Group>

          <Group title="Formulalar" action={editable && <button type="button" className={smallBtn} onClick={() => patch({ formulas: [...form.formulas, { label: "", pattern: "", note: "" }] })}>+ Formula</button>}>
            {form.formulas.map((x, i) => (
              <ListRow key={i} label="Formula" onRemove={() => patch({ formulas: form.formulas.filter((_, j) => j !== i) })}>
                <Field label="Nomi">{input(x.label, (v) => patch({ formulas: form.formulas.map((y, j) => (j === i ? { ...y, label: v } : y)) }))}</Field>
                <Field label="Andoza">{input(x.pattern, (v) => patch({ formulas: form.formulas.map((y, j) => (j === i ? { ...y, pattern: v } : y)) }), { lang: lang.code })}</Field>
                <Field label="Izoh">{input(x.note, (v) => patch({ formulas: form.formulas.map((y, j) => (j === i ? { ...y, note: v } : y)) }))}</Field>
              </ListRow>
            ))}
          </Group>

          <Group title="Misollar (kamida 2)" action={editable && <button type="button" className={smallBtn} onClick={() => patch({ examples: [...form.examples, { text: "", translation: "", note: "", reading: "", stressed: "", ruby: "" }] })}>+ Misol</button>}>
            {form.examples.map((x, i) => {
              const set = (k: keyof typeof x) => (v: string) => patch({ examples: form.examples.map((y, j) => (j === i ? { ...y, [k]: v } : y)) });
              return (
                <ListRow key={i} label="Misol" onRemove={() => patch({ examples: form.examples.filter((_, j) => j !== i) })}>
                  <Field label={`Matn (${lang.name})`}>{input(x.text, set("text"), { lang: lang.code })}</Field>
                  <Field label="Tarjima">{input(x.translation, set("translation"))}</Field>
                  <Field label="Izoh">{input(x.note, set("note"))}</Field>
                  <Field label="O'qilishi">{input(x.reading, set("reading"))}</Field>
                  {hasStress && <Field label="Urg'uli shakl" hint="Urg'usiz holda matn bilan bir xil bo'lishi kerak">{input(x.stressed, set("stressed"), { lang: lang.code })}</Field>}
                  {hasRuby && <Field label="Furigana" hint="Bo'sh joy bilan: 漢:かん 字:じ を">{input(x.ruby, set("ruby"), { lang: "ja" })}</Field>}
                </ListRow>
              );
            })}
          </Group>

          <Group title="Istisnolar" action={editable && <button type="button" className={smallBtn} onClick={() => patch({ exceptions: [...form.exceptions, { title: "", body: "" }] })}>+ Istisno</button>}>
            {form.exceptions.map((x, i) => (
              <ListRow key={i} label="Istisno" onRemove={() => patch({ exceptions: form.exceptions.filter((_, j) => j !== i) })}>
                <Field label="Sarlavha">{input(x.title, (v) => patch({ exceptions: form.exceptions.map((y, j) => (j === i ? { ...y, title: v } : y)) }))}</Field>
                <Field label="Matn">{input(x.body, (v) => patch({ exceptions: form.exceptions.map((y, j) => (j === i ? { ...y, body: v } : y)) }), { multiline: true })}</Field>
              </ListRow>
            ))}
          </Group>

          <Group title="Keng tarqalgan xatolar" action={editable && <button type="button" className={smallBtn} onClick={() => patch({ commonMistakes: [...form.commonMistakes, { wrong: "", right: "", explanation: "" }] })}>+ Xato</button>}>
            {form.commonMistakes.map((x, i) => {
              const set = (k: keyof typeof x) => (v: string) => patch({ commonMistakes: form.commonMistakes.map((y, j) => (j === i ? { ...y, [k]: v } : y)) });
              return (
                <ListRow key={i} label="Xato" onRemove={() => patch({ commonMistakes: form.commonMistakes.filter((_, j) => j !== i) })}>
                  <Field label="Noto'g'ri">{input(x.wrong, set("wrong"), { lang: lang.code })}</Field>
                  <Field label="To'g'ri">{input(x.right, set("right"), { lang: lang.code })}</Field>
                  <Field label="Tushuntirish">{input(x.explanation, set("explanation"), { multiline: true })}</Field>
                </ListRow>
              );
            })}
          </Group>

          <Group
            title="Jadval / tuslanish / kelishik bloklari"
            action={
              editable && (
                <div className="flex flex-wrap gap-2">
                  {lang.blocks.includes("table") && <button type="button" className={smallBtn} onClick={() => patch({ blocks: [...form.blocks, { kind: "table", caption: "", headers: "", rows: "" }] })}>+ Jadval</button>}
                  {lang.blocks.includes("conjugation") && <button type="button" className={smallBtn} onClick={() => patch({ blocks: [...form.blocks, { kind: "conjugation", caption: "", forms: "" }] })}>+ Tuslanish</button>}
                  {lang.blocks.includes("declension") && <button type="button" className={smallBtn} onClick={() => patch({ blocks: [...form.blocks, { kind: "declension", caption: "", word: "", gender: "", rows: "" }] })}>+ Kelishik</button>}
                </div>
              )
            }
          >
            {form.blocks.map((b, i) => {
              const set = (p: Partial<BlockF>) => patch({ blocks: form.blocks.map((y, j) => (j === i ? ({ ...y, ...p } as BlockF) : y)) });
              return (
                <ListRow key={i} label="Blok" onRemove={() => patch({ blocks: form.blocks.filter((_, j) => j !== i) })}>
                  <Field label={`Tur: ${b.kind}`}>{input(b.caption, (v) => set({ caption: v }), { placeholder: "Sarlavha" })}</Field>
                  {b.kind === "table" && (
                    <>
                      <Field label="Ustun sarlavhalari" hint="a | b | c">{input(b.headers, (v) => set({ headers: v } as Partial<BlockF>))}</Field>
                      <Field label="Qatorlar" hint="Har qator alohida satrda: x | y | z">{input(b.rows, (v) => set({ rows: v } as Partial<BlockF>), { multiline: true, rows: 5, lang: lang.code })}</Field>
                    </>
                  )}
                  {b.kind === "conjugation" && (
                    <Field label="Shakllar" hint="nomi | qiymat | o'qilishi (har biri alohida satrda)">{input(b.forms, (v) => set({ forms: v } as Partial<BlockF>), { multiline: true, rows: 5, lang: lang.code })}</Field>
                  )}
                  {b.kind === "declension" && (
                    <>
                      <Field label="So'z">{input(b.word, (v) => set({ word: v } as Partial<BlockF>), { lang: lang.code })}</Field>
                      <Field label="Qatorlar" hint="kelishik | id (nom/gen/dat/acc/ins/prep) | birlik | ko'plik | izoh">{input(b.rows, (v) => set({ rows: v } as Partial<BlockF>), { multiline: true, rows: 6, lang: lang.code })}</Field>
                    </>
                  )}
                </ListRow>
              );
            })}
          </Group>

          <Group title="Manbalar va litsenziya (kamida bitta)" action={editable && <button type="button" className={smallBtn} onClick={() => patch({ sources: [...form.sources, { title: "", url: "", author: "", license: "", attribution: "", shareAlike: false, review: "", reviewNote: "" }] })}>+ Manba</button>}>
            {form.sources.map((s, i) => {
              const set = (p: Partial<typeof s>) => patch({ sources: form.sources.map((y, j) => (j === i ? { ...y, ...p } : y)) });
              return (
                <ListRow key={i} label="Manba" onRemove={() => patch({ sources: form.sources.filter((_, j) => j !== i) })}>
                  <Field label="Nomi">{input(s.title, (v) => set({ title: v }))}</Field>
                  <Field label="URL (https)">{input(s.url, (v) => set({ url: v }))}</Field>
                  <Field label="Muallif">{input(s.author, (v) => set({ author: v }))}</Field>
                  <Field label="Litsenziya" hint="original, CC0, CC BY 4.0, CC BY-SA 4.0 …">{input(s.license, (v) => set({ license: v }))}</Field>
                  <Field label="Attribution matni">{input(s.attribution, (v) => set({ attribution: v }))}</Field>
                  <label className="flex items-center gap-2 text-base font-bold">
                    <input type="checkbox" checked={s.shareAlike} disabled={!editable} onChange={(e) => set({ shareAlike: e.target.checked })} className="size-5 accent-ink" />
                    ShareAlike talabi bor
                  </label>
                  {role === "ADMIN" && (
                    <Field label="Litsenziya tekshiruvi (huquqiy qaror)">
                      <select className={inputCls} value={s.review} disabled={!editable} onChange={(e) => set({ review: e.target.value as typeof s.review })}>
                        <option value="">—</option>
                        <option value="UNRESOLVED">UNRESOLVED</option>
                        <option value="ALLOWED">ALLOWED</option>
                        <option value="BLOCKED">BLOCKED</option>
                      </select>
                    </Field>
                  )}
                </ListRow>
              );
            })}
          </Group>

          <Group title="Qo'shimcha">
            <Field label="Kalit so'zlar" hint="vergul bilan">{input(form.keywords, (v) => patch({ keywords: v }))}</Field>
            <Field label="Bog'liq qoidalar (ID)" hint="gr_en_000001, gr_en_000002">{input(form.related, (v) => patch({ related: v }))}</Field>
          </Group>

          {issues.length > 0 && (
            <div role="alert" className="border-[3px] border-ink bg-tomato/30 p-4" data-testid="issues">
              <p className="label">Tekshiruv natijasi ({issues.length})</p>
              <ul className="mt-2 list-disc pl-5">
                {issues.map((i, k) => <li key={k}><code className="font-mono text-sm">{i.path}</code> — {i.message}</li>)}
              </ul>
            </div>
          )}
          {msg && (
            <p role={msg.tone === "err" ? "alert" : "status"} className={cn("border-[3px] border-ink p-3 font-bold", msg.tone === "ok" ? "bg-acid" : "bg-tomato/30")} data-testid="msg">
              {msg.text}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {editable && <button type="submit" className={primaryBtn} disabled={busy !== null} data-testid="save">{busy === "save" ? "Saqlanmoqda…" : "Saqlash"}</button>}
            {revision.canSubmit && <button type="button" className={smallBtn} disabled={busy !== null} onClick={() => void act("submit")} data-testid="submit">Tekshiruvga yuborish</button>}
            {revision.canWithdraw && <button type="button" className={smallBtn} disabled={busy !== null} onClick={() => void act("withdraw")} data-testid="withdraw">Qaytarib olish</button>}
            {rule.canDelete && <button type="button" className={smallBtn} disabled={busy !== null} onClick={() => void remove()} data-testid="delete">O&apos;chirish</button>}
          </div>
        </form>

        <section aria-label="Oldindan ko'rish" className={cn("min-w-0 border-[3px] border-ink bg-paper p-4", tab === "edit" && "hidden lg:block")} data-testid="preview">
          <p className="label mb-4">Oldindan ko&apos;rish (o&apos;quvchi ko&apos;rinishi)</p>
          <h2 className="display-cond text-[clamp(28px,4vw,44px)]" lang="uz">{preview?.title}</h2>
          {preview && <RuleSections t={preview} lang={lang.code} />}
        </section>
      </div>
    </div>
  );
}
