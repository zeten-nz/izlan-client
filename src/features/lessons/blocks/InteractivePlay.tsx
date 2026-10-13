"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { BLANK_RE, type AnswerResult, type AttemptView, type PlayerBlock } from "../types";
import type { OnAnswer } from "./BlockView";
import { u } from "./units";

type ChoiceP = Extract<PlayerBlock, { type: "choice" }>;
type FillP = Extract<PlayerBlock, { type: "fillblank" }>;

const card = { borderWidth: u(4), padding: u(18) } as const;

function Feedback({ result, done }: { result: AnswerResult | null; done: boolean }) {
  if (!result && !done) return null;
  const ok = result ? result.correct : done;
  return (
    <div
      role="status"
      className={cn("mt-3 border-ink font-semibold", ok ? "bg-[#8df0a8]" : "bg-tomato")}
      style={{ borderWidth: u(3), padding: u(12), fontSize: u(24) }}
    >
      {ok ? "To'g'ri!" : "Noto'g'ri. Qayta urinib ko'ring."}
      {result?.explanation ? <p className="mt-1 font-medium">{result.explanation}</p> : null}
    </div>
  );
}

function CheckButton({ disabled, busy, onClick }: { disabled: boolean; busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className="mt-3 border-ink bg-ink px-5 py-2 font-display font-black uppercase text-paper disabled:opacity-40"
      style={{ borderWidth: u(3), fontSize: u(22) }}
    >
      {busy ? "…" : "Tekshirish"}
    </button>
  );
}

export function ChoicePlay({ block, attempt, onAnswer }: { block: ChoiceP; attempt?: AttemptView; onAnswer: OnAnswer }) {
  const saved = (attempt?.response as { selected?: string[] } | undefined)?.selected;
  const [sel, setSel] = useState<string[]>(saved ?? []);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = !!attempt?.everCorrect || result?.correct === true;

  const toggle = (id: string) => {
    if (locked) return;
    setResult(null);
    setSel((s) => (block.multiple ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id]));
  };
  const submit = async () => {
    setBusy(true);
    setResult(await onAnswer(block.id, { selected: sel }));
    setBusy(false);
  };

  return (
    <div className="h-full w-full overflow-auto border-ink bg-white" style={card}>
      <p className="font-bold leading-snug" style={{ fontSize: u(30) }}>
        {block.question}
      </p>
      {block.multiple ? <p className="label mt-1 opacity-70">Bir nechta javob bo&apos;lishi mumkin</p> : null}
      <div role={block.multiple ? "group" : "radiogroup"} className="mt-2 space-y-2" style={{ fontSize: u(26) }}>
        {block.options.map((o, i) => {
          const on = sel.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              role={block.multiple ? "checkbox" : "radio"}
              aria-checked={on}
              disabled={locked}
              onClick={() => toggle(o.id)}
              className={cn(
                "flex w-full items-center gap-3 border-ink px-3 py-1.5 text-left font-medium transition-colors",
                on ? "bg-acid" : "bg-paper hover:bg-paper-2",
                locked && "cursor-default",
              )}
              style={{ borderWidth: u(3) }}
            >
              <span aria-hidden className="font-mono text-[0.8em] font-bold opacity-60">
                {String.fromCharCode(65 + i)}
              </span>
              {o.text}
            </button>
          );
        })}
      </div>
      {!locked ? <CheckButton disabled={sel.length === 0} busy={busy} onClick={submit} /> : null}
      <Feedback result={result} done={!!attempt?.everCorrect && !result} />
    </div>
  );
}

export function FillBlankPlay({ block, attempt, onAnswer }: { block: FillP; attempt?: AttemptView; onAnswer: OnAnswer }) {
  const saved = (attempt?.response as { values?: Record<string, string> } | undefined)?.values;
  const [vals, setVals] = useState<Record<string, string>>(saved ?? {});
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = !!attempt?.everCorrect || result?.correct === true;
  const parts = block.template.split(BLANK_RE);
  const filled = block.blanks.every((b) => (vals[b.id] ?? "").trim());

  const submit = async () => {
    setBusy(true);
    setResult(await onAnswer(block.id, { values: Object.fromEntries(block.blanks.map((b) => [b.id, vals[b.id] ?? ""])) }));
    setBusy(false);
  };

  return (
    <div className="h-full w-full overflow-auto border-ink bg-white" style={card}>
      <div className="font-medium leading-[2]" style={{ fontSize: u(30) }}>
        {parts.map((p, i) =>
          i % 2 === 0 ? (
            <span key={i}>{p}</span>
          ) : (
            <input
              key={i}
              value={vals[p] ?? ""}
              disabled={locked}
              aria-label={`Bo'sh joy ${p}`}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(e) => {
                setResult(null);
                setVals((v) => ({ ...v, [p]: e.target.value }));
              }}
              className={cn(
                "mx-1 inline-block border-0 border-b-[3px] border-ink bg-paper px-2 text-center font-bold outline-none focus:bg-acid",
                result?.blanks && (result.blanks[p] ? "bg-[#8df0a8]" : "bg-tomato/60"),
              )}
              style={{ width: u(Math.max(120, (vals[p]?.length ?? 0) * 18 + 60)), fontSize: "inherit" }}
            />
          ),
        )}
      </div>
      {!locked ? <CheckButton disabled={!filled} busy={busy} onClick={submit} /> : null}
      <Feedback result={result} done={!!attempt?.everCorrect && !result} />
    </div>
  );
}
