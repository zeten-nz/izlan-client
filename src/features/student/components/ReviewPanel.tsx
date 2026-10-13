"use client";

import Link from "next/link";
import { useState } from "react";
import { RichText } from "@/lib/rich";
import { cn } from "@/lib/cn";
import type { MistakeGroup, MistakeItem } from "../types";

const LETTERS = ["A", "B", "C", "D"];

function Item({ item }: { item: MistakeItem }) {
  const parts = item.prompt.split("_____");
  return (
    <div className="border-[3px] border-ink bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="label">Savol · {item.levelCode}</p>
        {item.count > 1 && <span className="label border-2 border-ink bg-tomato px-1.5 py-0.5 text-[10px]">{item.count} marta xato</span>}
      </div>
      <p className="mt-2 text-lg font-semibold leading-snug">
        {parts.length > 1 ? (
          <>
            {parts[0]}
            <span className="mx-1 inline-block min-w-14 border-b-[3px] border-ink text-center">&nbsp;</span>
            {parts[1]}
          </>
        ) : (
          item.prompt
        )}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {item.options.map((o, i) => {
          const right = i === item.correctIndex;
          const wrong = i === item.chosenIndex && !right;
          return (
            <li
              key={o}
              className={cn(
                "flex items-center gap-2 border-[3px] px-3 py-2",
                right ? "border-ink bg-acid font-bold" : wrong ? "border-ink bg-tomato/80 line-through decoration-2" : "border-ink/25 text-ink/60",
              )}
            >
              <span className="font-mono text-sm font-bold">{LETTERS[i]})</span>
              <span>{o}</span>
              {right && <span className="label ml-auto text-[10px]">To&apos;g&apos;ri</span>}
              {wrong && <span className="label ml-auto text-[10px] no-underline">Sizniki</span>}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 leading-snug">
        <span className="label mr-2">To&apos;g&apos;ri gap:</span>
        <em className="serif-i text-[19px]">{item.correctSentence}</em>
      </p>
      {item.note && <p className="mt-1 text-sm text-ink/70">{item.note}</p>}
    </div>
  );
}

function Group({ group, defaultOpen }: { group: MistakeGroup; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <article className="border-[3px] border-ink bg-paper shadow-[6px_6px_0_0_var(--color-ink)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 p-4 text-left hover:bg-acid/40 sm:p-5"
      >
        <span className="grid size-14 shrink-0 place-items-center border-[3px] border-ink bg-tomato text-center font-display text-2xl font-black leading-none shadow-[3px_3px_0_0_var(--color-ink)]" aria-hidden>
          {group.total}×
        </span>
        <span className="min-w-0 flex-1">
          <span className="display-cond block text-xl sm:text-2xl">{group.title}</span>
          <span className="mt-0.5 block text-[15px] text-ink/75">
            {group.total} marta xato qildingiz · {group.topic.levelCode} · {group.topic.title}
          </span>
        </span>
        <span aria-hidden className={cn("text-2xl transition-transform", open && "rotate-180")}>⌄</span>
      </button>

      {open && (
        <div className="space-y-4 border-t-[3px] border-ink p-4 sm:p-5">
          <p className="border-[3px] border-ink bg-white px-4 py-3 font-semibold leading-snug">
            &ldquo;{group.title}&rdquo; mavzusida {group.total} marta xato qildingiz. Mavzuni qayta ko&apos;rib chiqing.
          </p>

          <div className="space-y-3">
            {group.items.map((it) => (
              <Item key={it.questionId} item={it} />
            ))}
          </div>

          <div className="border-[3px] border-ink bg-sky p-4 shadow-[4px_4px_0_0_var(--color-ink)] sm:p-5">
            <p className="label">Tip</p>
            <h4 className="display-cond mt-1 text-xl sm:text-2xl">{group.tipTitle}</h4>
            <div className="mt-2 leading-snug">
              <RichText text={group.tipBody} />
            </div>
            <p className="mt-3 border-t-[3px] border-ink pt-3 font-semibold">
              <span className="label mr-2">Eslab qoling:</span>
              {group.remember}
            </p>
          </div>

          {group.topic.accessible ? (
            <Link
              href={`/student/topic/${group.topic.id}`}
              className="inline-flex border-[3px] border-ink bg-acid px-4 py-2.5 font-display text-sm font-black uppercase shadow-[4px_4px_0_0_var(--color-ink)] hover:-translate-y-0.5"
            >
              Mavzuni qayta o&apos;qish: {group.topic.title} →
            </Link>
          ) : (
            <p className="label text-ink/60">Mavzu hali ochilmagan: {group.topic.title}</p>
          )}
        </div>
      )}
    </article>
  );
}

/** Qayta takrorlash: xatolar mavzu (qoida) bo'yicha jamlangan, takroriy xatolar sanaladi, dublikat emas. */
export function ReviewPanel({ groups }: { groups: MistakeGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="border-[3px] border-dashed border-ink bg-white p-6 sm:p-8">
        <p className="display-cond text-2xl">Hozircha xato yo&apos;q</p>
        <p className="mt-2 max-w-xl text-lg leading-snug">
          Test va mashqlarda xato qilgan savollaringiz shu yerda mavzu bo&apos;yicha yig&apos;iladi: nima uchun xato bo&apos;lgani tushuntirilgan holda.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {groups.map((g, i) => (
        <Group key={g.ruleKey} group={g} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
