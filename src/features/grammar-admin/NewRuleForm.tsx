"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputCls, primaryBtn } from "@/features/notebook/ui";
import { slugify, SLUG_OK } from "./content-form";
import { gcall, type Issue, type LanguageCfg } from "./gapi";

/** Yangi qoida: asosiy ma'lumot, so'ng muharrirga o'tadi. Muallif/holat/ID serverda belgilanadi. */
export function NewRuleForm({ languages, base }: { languages: LanguageCfg[]; base: string }) {
  const router = useRouter();
  const enabled = languages.filter((l) => l.enabled);
  const [lang, setLang] = useState(enabled[0]?.code ?? "");
  const cfg = enabled.find((l) => l.code === lang);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [provenance, setProvenance] = useState("ORIGINAL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);

  const effSlug = slugTouched ? slug : slugify(title);
  const effCat = category || cfg?.categories[0]?.id || "";
  const slugErr = effSlug && !SLUG_OK.test(effSlug) ? "Faqat kichik lotin harflari, raqam va defis" : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cfg || slugErr || !title.trim() || !effSlug) return;
    setBusy(true);
    setError("");
    setIssues([]);
    const res = await gcall<{ ruleId: string }>("POST", "/staff/grammar/manage/rules", {
      lang,
      slug: effSlug,
      category: effCat,
      provenance,
      ...(cfg.levelSystem !== "none" && level ? { level: { system: cfg.levelSystem, value: level } } : {}),
      content: { title: title.trim() },
    });
    setBusy(false);
    if (res.ok) router.push(`${base}/${res.data.ruleId}`);
    else {
      setError(res.message);
      setIssues(res.issues);
    }
  }

  if (!enabled.length) return <p className="border-[3px] border-ink bg-white p-4">Yoqilgan til yo&apos;q.</p>;

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5" aria-label="Yangi qoida">
      <Field label="Til">
        <select className={inputCls} value={lang} onChange={(e) => { setLang(e.target.value); setCategory(""); setLevel(""); }}>
          {enabled.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </Field>
      <Field label="Sarlavha (o'zbekcha)">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      </Field>
      <Field label="Slug (URL)" error={slugErr} hint="Sarlavhadan avtomatik; keyin o'zgartirish tasdiqdan oldin mumkin">
        <input className={inputCls} value={effSlug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} required />
      </Field>
      <Field label="Kategoriya">
        <select className={inputCls} value={effCat} onChange={(e) => setCategory(e.target.value)}>
          {cfg?.categories.map((c) => <option key={c.id} value={c.id}>{c.title.uz ?? c.id}</option>)}
        </select>
      </Field>
      {cfg && cfg.levelSystem !== "none" && (
        <Field label={`Daraja (${cfg.levelSystem.toUpperCase()})`}>
          <select className={inputCls} value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">—</option>
            {(cfg.levelSystem === "jlpt" ? ["N5", "N4", "N3", "N2", "N1"] : ["A1", "A2", "B1", "B2", "C1", "C2"]).map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
      )}
      <Field label="Kontent kelib chiqishi" hint="Tashqi manbadan olingan bo'lsa EXTERNAL/MIXED — litsenziya tekshiriladi">
        <select className={inputCls} value={provenance} onChange={(e) => setProvenance(e.target.value)}>
          <option value="ORIGINAL">O&apos;zim yozdim (original)</option>
          <option value="EXTERNAL">Tashqi manba</option>
          <option value="MIXED">Aralash</option>
        </select>
      </Field>
      {error && <p role="alert" className="border-[3px] border-ink bg-tomato/30 p-3 font-bold">{error}</p>}
      {issues.length > 0 && <ul className="list-disc pl-5">{issues.map((i, k) => <li key={k}>{i.path}: {i.message}</li>)}</ul>}
      <button type="submit" className={primaryBtn} disabled={busy || !!slugErr || !title.trim()}>{busy ? "Yaratilmoqda…" : "Yaratish va tahrirlash"}</button>
    </form>
  );
}
