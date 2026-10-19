"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, inputCls, smallBtn } from "@/features/notebook/ui";
import { cn } from "@/lib/cn";
import { STATUS_LABEL, type RuleRow } from "./gapi";

const FILTERS = ["ALL", "DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED", "REJECTED"] as const;

/** Qoidalar ro'yxati. `base` — /teacher/grammar yoki /admin/grammar. Boshqa muallifniki Teacher uchun faqat o'qish. */
export function RuleList({ rules, base, role }: { rules: RuleRow[]; base: string; role: "TEACHER" | "ADMIN" }) {
  const [status, setStatus] = useState<(typeof FILTERS)[number]>("ALL");
  const [q, setQ] = useState("");
  const [mineOnly, setMineOnly] = useState(role === "TEACHER");

  const rows = useMemo(
    () =>
      rules.filter((r) => {
        if (mineOnly && !r.mine) return false;
        if (status !== "ALL" && !r.revisions.some((v) => v.status === status)) return false;
        const hay = `${r.id} ${r.slug} ${r.revisions.map((v) => v.title).join(" ")}`.toLowerCase();
        return !q.trim() || hay.includes(q.trim().toLowerCase());
      }),
    [rules, status, q, mineOnly],
  );

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[200px] flex-1">
          <span className="label">Qidiruv</span>
          <input className={cn(inputCls, "mt-1")} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sarlavha, slug yoki ID" />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-base font-bold">
          <input type="checkbox" className="size-5 accent-ink" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
          Faqat meniki
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Holat bo'yicha filtr">
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={status === f} onClick={() => setStatus(f)} className={cn(smallBtn, status === f && "bg-ink text-paper")}>
            {f === "ALL" ? "Hammasi" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Qoida topilmadi">Filtrlarni o&apos;zgartiring yoki yangi qoida yarating.</EmptyState>
        </div>
      ) : (
        <ul className="mt-6 space-y-3" data-testid="rule-list">
          {rows.map((r) => {
            const v = r.revisions[0];
            return (
              <li key={r.id} className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`${base}/${r.id}`} className="display-cond text-2xl underline-offset-4 hover:underline">
                    {v?.title || r.slug}
                  </Link>
                  {v && <span className="label border-[3px] border-ink bg-paper px-2 py-0.5">{STATUS_LABEL[v.status]}</span>}
                  {r.hidden && <span className="label border-[3px] border-ink bg-ink px-2 py-0.5 text-paper">yashirilgan</span>}
                  {r.state === "RETIRED" && <span className="label border-[3px] border-ink bg-ink px-2 py-0.5 text-paper">nafaqada</span>}
                  {v?.selfApproved && <span className="label border-[3px] border-ink bg-tomato px-2 py-0.5">o&apos;zi tasdiqlagan</span>}
                  {!r.mine && role === "TEACHER" && <span className="label text-ink/60">faqat o&apos;qish</span>}
                </div>
                <p className="mt-1 text-sm text-ink/70">
                  {r.id} · {r.lang}/{r.slug} · {v?.authorLabel ?? (r.mine ? "siz" : "ustoz")} · {v?.provenance}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
