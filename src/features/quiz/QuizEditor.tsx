"use client";

import { useState } from "react";
import { apiPost, apiSend } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Field, inputCls, primaryBtn, smallBtn } from "@/features/notebook/ui";

type Q = { id: string; text: string; options: { id: string; text: string }[]; correctId: string };

export type EditorData = {
  topic: { id: string; title: string };
  quiz: { id: string; title: string; draft: { rev: number; questions: Q[] } | null; published: { publishedAt: string; count: number } | null } | null;
};

const uid = () => `q${Math.random().toString(36).slice(2, 9)}`;
const blank = (): Q => ({
  id: uid(),
  text: "",
  options: [
    { id: "a", text: "" },
    { id: "b", text: "" },
  ],
  correctId: "a",
});

/** Ustoz: mavzu testi muharriri. Saqlash/nashr serverda tekshiriladi (vakolat, tuzilma). Natija hisobi o'quvchi tomonda emas. */
export function QuizEditor({ data }: { data: EditorData }) {
  const [title, setTitle] = useState(data.quiz?.title ?? `${data.topic.title}: test`);
  const [qs, setQs] = useState<Q[]>(data.quiz?.draft?.questions?.length ? data.quiz.draft.questions : [blank(), blank(), blank()]);
  const [rev, setRev] = useState<number | undefined>(data.quiz?.draft?.rev);
  const [published, setPublished] = useState(data.quiz?.published ?? null);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const patch = (i: number, p: Partial<Q>) => setQs((a) => a.map((q, k) => (k === i ? { ...q, ...p } : q)));

  async function save(): Promise<boolean> {
    setBusy("save");
    setMsg(null);
    const r = await apiSend<{ rev: number }>("PUT", `/staff/quizzes/topic/${data.topic.id}`, { title, questions: qs, ...(rev !== undefined && { rev }) });
    setBusy(null);
    if (r.ok) {
      setRev(r.data.rev);
      setMsg({ ok: true, text: "Qoralama saqlandi" });
      return true;
    }
    setMsg({ ok: false, text: r.message });
    return false;
  }

  async function publish() {
    if (!(await save())) return;
    setBusy("publish");
    const r = await apiPost<{ count: number }>(`/staff/quizzes/topic/${data.topic.id}/publish`, {});
    setBusy(null);
    if (r.ok) {
      setPublished({ publishedAt: new Date().toISOString(), count: r.data.count });
      setMsg({ ok: true, text: `Nashr qilindi (${r.data.count} ta savol)` });
    } else setMsg({ ok: false, text: r.message });
  }

  return (
    <div className="space-y-6">
      <Field label="Test nomi">
        <input className={inputCls} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <ol className="space-y-5">
        {qs.map((q, i) => (
          <li key={q.id} className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
            <div className="flex items-center justify-between gap-2">
              <span className="label">{i + 1}-savol</span>
              <button type="button" className={smallBtn} onClick={() => setQs((a) => a.filter((_, k) => k !== i))} disabled={qs.length <= 1}>
                O&apos;chirish
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <Field label="Savol matni">
                <input className={inputCls} value={q.text} maxLength={500} onChange={(e) => patch(i, { text: e.target.value })} />
              </Field>
              <fieldset>
                <legend className="label">Variantlar (to&apos;g&apos;risini belgilang)</legend>
                <div className="mt-2 space-y-2">
                  {q.options.map((o, k) => (
                    <div key={o.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        aria-label={`${k + 1}-variant to'g'ri`}
                        className="size-5 shrink-0 accent-ink"
                        checked={q.correctId === o.id}
                        onChange={() => patch(i, { correctId: o.id })}
                      />
                      <input
                        className={cn(inputCls, "min-w-0")}
                        value={o.text}
                        maxLength={200}
                        aria-label={`${k + 1}-variant`}
                        onChange={(e) => patch(i, { options: q.options.map((x, j) => (j === k ? { ...x, text: e.target.value } : x)) })}
                      />
                      <button
                        type="button"
                        className={smallBtn}
                        disabled={q.options.length <= 2}
                        aria-label={`${k + 1}-variantni o'chirish`}
                        onClick={() => {
                          const options = q.options.filter((_, j) => j !== k);
                          patch(i, { options, correctId: options.some((x) => x.id === q.correctId) ? q.correctId : options[0].id });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {q.options.length < 6 && (
                  <button
                    type="button"
                    className={cn(smallBtn, "mt-2")}
                    onClick={() => patch(i, { options: [...q.options, { id: `o${Math.random().toString(36).slice(2, 7)}`, text: "" }] })}
                  >
                    + Variant
                  </button>
                )}
              </fieldset>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={smallBtn} disabled={qs.length >= 30} onClick={() => setQs((a) => [...a, blank()])}>
          + Savol
        </button>
        <button type="button" className={smallBtn} disabled={busy !== null} onClick={() => void save()}>
          {busy === "save" ? "Saqlanmoqda..." : "Qoralamani saqlash"}
        </button>
        <button type="button" className={primaryBtn} disabled={busy !== null} onClick={() => void publish()}>
          {busy === "publish" ? "Nashr qilinmoqda..." : "Nashr qilish"}
        </button>
      </div>
      <p className="text-sm text-ink/70">
        Nashr uchun kamida 3 ta savol kerak. {published ? `Hozirgi nashr: ${published.count} ta savol.` : "Hali nashr qilinmagan."}
      </p>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={cn("label border-2 border-ink px-2 py-1", msg.ok ? "bg-acid" : "bg-tomato text-paper")}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
