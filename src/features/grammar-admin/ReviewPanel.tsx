"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { smallBtn, inputCls } from "@/features/notebook/ui";
import { cn } from "@/lib/cn";
import { fmtDateTime } from "./fmt";
import { gcall, STATUS_LABEL, type RevisionView, type RuleView } from "./gapi";

type Event = { id: string; action: string; fromStatus: string | null; toStatus: string | null; note: string | null; actorId: string | null; createdAt: string };

const CHECKS = [
  ["grammar", "Grammatik tushuntirish to'g'ri"],
  ["examples", "Misollar to'g'ri va tabiiy"],
  ["translations", "Tarjimalar to'g'ri"],
  ["level", "Daraja mos"],
  ["license", "Manba va litsenziya tekshirildi"],
] as const;

const FIELDS = ["title", "summary", "body", "formulas", "examples", "exceptions", "commonMistakes", "blocks", "keywords", "sources", "related"] as const;

/** Oldingi tasdiqlangan revision bilan maydon-darajasidagi farq. */
function diffFields(prev: Record<string, unknown> | null, cur: Record<string, unknown>) {
  return FIELDS.filter((k) => JSON.stringify(prev?.[k] ?? null) !== JSON.stringify(cur[k] ?? null)).map((k) => ({
    field: k,
    before: prev?.[k] ?? null,
    after: cur[k] ?? null,
  }));
}

/** Admin: ko'rib chiqish (diff, checklist, tasdiqlash/tuzatish/rad), yashirish, nafaqa, yangi revision, tarix, foydalanish. */
export function ReviewPanel({ rule, revision }: { rule: RuleView; revision: RevisionView }) {
  const router = useRouter();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [usage, setUsage] = useState<{ id: string; title: string }[] | null>(null);

  const prevApproved = rule.revisions.filter((r) => r.status === "APPROVED" && r.id !== revision.id).sort((a, b) => b.revisionNo - a.revisionNo)[0] ?? null;
  const diff = diffFields(prevApproved?.content ?? null, revision.content);
  const allChecked = CHECKS.every(([k]) => checks[k]);
  const open = rule.revisions.some((r) => ["DRAFT", "IN_REVIEW", "CHANGES_REQUESTED"].includes(r.status));

  useEffect(() => {
    void gcall<Event[]>("GET", `/admin/grammar/rules/${rule.id}/history`).then((r) => r.ok && setEvents(r.data));
    void gcall<{ id: string; title: string }[]>("GET", `/admin/grammar/rules/${rule.id}/usage`).then((r) => r.ok && setUsage(r.data));
  }, [rule.id, revision.status, rule.hidden]);

  async function run(label: string, method: "POST" | "DELETE", path: string, body?: unknown, after: "refresh" | "none" = "refresh") {
    setBusy(label);
    setMsg(null);
    const res = await gcall<{ selfApproved?: boolean }>(method, path, body);
    setBusy(null);
    if (res.ok) {
      setMsg({ tone: "ok", text: "Bajarildi" + (res.data?.selfApproved ? " (o'zi tasdiqlagan deb belgilandi)" : "") });
      if (after === "refresh") router.refresh();
    } else setMsg({ tone: "err", text: res.message + (res.issues.length ? `: ${res.issues.map((i) => i.message).join("; ")}` : "") });
  }

  const reason = (q: string) => {
    const r = window.prompt(q);
    return r && r.trim().length >= 3 ? r.trim() : null;
  };

  return (
    <aside className="space-y-6" aria-label="Ko'rib chiqish" data-testid="review-panel">
      {revision.status === "IN_REVIEW" && (
        <section className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
          <h2 className="display-cond text-2xl">Ko&apos;rib chiqish</h2>
          <p className="mt-1 text-sm text-ink/70">Tasdiqlash faqat shu revisionni TASDIQLANGAN qiladi. O&apos;quvchiga ko&apos;rinishi uchun alohida release kerak.</p>

          <h3 className="label mt-4">Farq {prevApproved ? `(v${prevApproved.revisionNo} → v${revision.revisionNo})` : "(yangi qoida)"}</h3>
          {diff.length === 0 ? <p className="mt-1">O&apos;zgarish yo&apos;q</p> : (
            <ul className="mt-2 space-y-2">
              {diff.map((d) => (
                <li key={d.field}>
                  <details>
                    <summary className="cursor-pointer font-bold">{d.field}</summary>
                    <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap border-[2px] border-ink/30 bg-paper p-2 text-xs">- {JSON.stringify(d.before, null, 1)}</pre>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap border-[2px] border-ink/30 bg-acid/30 p-2 text-xs">+ {JSON.stringify(d.after, null, 1)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          )}

          <fieldset className="mt-4">
            <legend className="label">Checklist</legend>
            {CHECKS.map(([k, label]) => (
              <label key={k} className="mt-2 flex items-center gap-2 text-base">
                <input type="checkbox" className="size-5 accent-ink" checked={!!checks[k]} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} />
                {label}
              </label>
            ))}
          </fieldset>
          <label className="mt-4 block">
            <span className="label">Izoh (tuzatish/rad uchun majburiy)</span>
            <textarea className={cn(inputCls, "mt-1")} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className={cn(smallBtn, "bg-acid")} disabled={!allChecked || busy !== null} data-testid="approve"
              onClick={() => void run("approve", "POST", `/admin/grammar/revisions/${revision.id}/approve`, { contentHash: revision.contentHash, checks, note: note || undefined })}>
              Tasdiqlash
            </button>
            <button className={smallBtn} disabled={!note.trim() || busy !== null} data-testid="request-changes"
              onClick={() => void run("rc", "POST", `/admin/grammar/revisions/${revision.id}/request-changes`, { note })}>
              Tuzatish so&apos;rash
            </button>
            <button className={smallBtn} disabled={!note.trim() || busy !== null} data-testid="reject"
              onClick={() => void run("rj", "POST", `/admin/grammar/revisions/${revision.id}/reject`, { note })}>
              Rad etish
            </button>
          </div>
          {revision.authorId && (
            <p className="mt-3 text-sm text-ink/70">Muallif: {revision.authorLabel ?? revision.authorId}. Admin o&apos;zi yozganini tasdiqlasa, bu &laquo;o&apos;zi tasdiqlagan&raquo; deb belgilanadi va auditga yoziladi.</p>
          )}
        </section>
      )}

      <section className="border-[3px] border-ink bg-white p-4">
        <h2 className="display-cond text-2xl">Boshqaruv</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {revision.status === "APPROVED" && !open && rule.state === "OPEN" && (
            <button className={smallBtn} disabled={busy !== null} data-testid="new-revision"
              onClick={() => void (async () => {
                setBusy("nr");
                const res = await gcall<{ revisionId: string }>("POST", `/admin/grammar/rules/${rule.id}/revisions`);
                setBusy(null);
                if (res.ok) router.refresh();
                else setMsg({ tone: "err", text: res.message });
              })()}>
              Yangi revision ochish
            </button>
          )}
          {rule.state === "OPEN" && (
            rule.hidden ? (
              <button className={smallBtn} disabled={busy !== null} onClick={() => { const r = reason("Qayta ko'rsatish sababi:"); if (r) void run("unhide", "POST", `/admin/grammar/rules/${rule.id}/unhide`, { reason: r }); }}>Qayta ko&apos;rsatish</button>
            ) : (
              <button className={cn(smallBtn, "bg-tomato")} disabled={busy !== null} data-testid="hide" onClick={() => { const r = reason("Yashirish sababi (darhol o'quvchilardan olinadi):"); if (r) void run("hide", "POST", `/admin/grammar/rules/${rule.id}/hide`, { reason: r }); }}>Yashirish (kill-switch)</button>
            )
          )}
          {rule.state === "OPEN" && (
            <button className={smallBtn} disabled={busy !== null} data-testid="retire" onClick={() => {
              const r = reason("Nafaqaga chiqarish sababi (qaytarib bo'lmaydi):");
              if (!r) return;
              const rep = window.prompt("Almashtiruvchi qoida ID (bo'sh qoldirish mumkin):")?.trim() || null;
              void (async () => {
                setBusy("retire");
                const res = await gcall("POST", `/admin/grammar/rules/${rule.id}/retire`, { reason: r, replacedById: rep });
                if (!res.ok && res.status === 409 && res.body?.usedBy && window.confirm(`Qoida ${(res.body.usedBy as unknown[]).length} ta darsda ishlatilmoqda. Baribir nafaqaga chiqarilsinmi?`)) {
                  const again = await gcall("POST", `/admin/grammar/rules/${rule.id}/retire`, { reason: r, replacedById: rep, acknowledgeUsage: true });
                  setBusy(null);
                  setMsg(again.ok ? { tone: "ok", text: "Nafaqaga chiqarildi (keyingi release'da kuchga kiradi)" } : { tone: "err", text: again.message });
                } else {
                  setBusy(null);
                  setMsg(res.ok ? { tone: "ok", text: "Nafaqaga chiqarildi (keyingi release'da kuchga kiradi)" } : { tone: "err", text: res.message });
                }
                router.refresh();
              })();
            }}>Nafaqaga chiqarish</button>
          )}
        </div>
        {msg && <p role={msg.tone === "err" ? "alert" : "status"} className={cn("mt-3 border-[3px] border-ink p-3 font-bold", msg.tone === "ok" ? "bg-acid" : "bg-tomato/30")} data-testid="review-msg">{msg.text}</p>}
      </section>

      <section className="border-[3px] border-ink bg-white p-4">
        <h2 className="display-cond text-2xl">Versiyalar</h2>
        <ul className="mt-2 space-y-1">
          {rule.revisions.map((r) => (
            <li key={r.id}>
              <a className={cn("underline underline-offset-4", r.id === revision.id && "font-black")} href={`?rev=${r.id}`}>
                v{r.revisionNo} — {STATUS_LABEL[r.status]}
              </a>
              {r.selfApproved && " · o'zi tasdiqlagan"}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-[3px] border-ink bg-white p-4">
        <h2 className="display-cond text-2xl">Foydalanish</h2>
        {usage === null ? <p>Yuklanmoqda…</p> : usage.length === 0 ? <p>Nashr qilingan darslarda ishlatilmaydi.</p> : (
          <ul className="mt-2 list-disc pl-5">{usage.map((u) => <li key={u.id}>{u.title}</li>)}</ul>
        )}
      </section>

      <section className="border-[3px] border-ink bg-white p-4">
        <h2 className="display-cond text-2xl">Hodisalar</h2>
        <ul className="mt-2 max-h-72 space-y-2 overflow-auto text-sm">
          {events.map((e) => (
            <li key={e.id}>
              <span className="font-bold">{e.action}</span> {e.fromStatus && e.toStatus ? `${e.fromStatus} → ${e.toStatus}` : ""} · {fmtDateTime(e.createdAt)}
              {e.note ? <span className="block text-ink/70">{e.note}</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
