"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { RichText } from "@/lib/rich";
import { cn } from "@/lib/cn";
import {
  assetUrl,
  BLANK_RE,
  type AnswerResult,
  type AttemptView,
  type Block,
  type CalloutTone,
  type ChoiceBlock,
  type FillBlankBlock,
  type PlayerBlock,
} from "../types";
import { grammarOpenHref, useGrammarRules, useLessonLocation } from "./grammar-context";
import { ChoicePlay, FillBlankPlay } from "./InteractivePlay";
import { u } from "./units";

export type OnAnswer = (blockId: string, payload: Record<string, unknown>) => Promise<AnswerResult | null>;

type Props = {
  block: Block | PlayerBlock;
  /** design = tahrirlash oynasi (javoblar ko'rinadi, interaktivlik yo'q); play = o'quvchi */
  mode: "design" | "play";
  attempt?: AttemptView;
  onAnswer?: OnAnswer;
};

/** Darslik uslubidagi qutilar: rangli sarlavha tasmasi + belgi, ochroq tanasi. */
const TONES: Record<CalloutTone, { label: string; strip: string; body: string; icon: ReactNode }> = {
  rule: { label: "Qoida", strip: "bg-[#ffd400]", body: "bg-[#fff3b0]", icon: <path d="M6 3h12v18l-6-4-6 4z" /> },
  example: {
    label: "Misol",
    strip: "bg-cobalt text-white",
    body: "bg-[#dfe8ff]",
    icon: <path d="M4 5h16v11H9l-5 4zM8 9h8M8 12h5" />,
  },
  tip: {
    label: "Eslatma",
    strip: "bg-acid",
    body: "bg-[#f6ffd6]",
    icon: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" />,
  },
  warning: { label: "Diqqat", strip: "bg-tomato text-white", body: "bg-[#ffe1d6]", icon: <path d="M12 3 2 20h20zM12 10v4M12 17v.5" /> },
  info: { label: "Ma'lumot", strip: "bg-sky", body: "bg-[#eaf6ff]", icon: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5" /> },
  success: { label: "Xulosa", strip: "bg-[#8df0a8]", body: "bg-[#e3fbe9]", icon: <path d="M4 12.5 9.5 18 20 6" /> },
};

/** O'quvchi pleerida matn bloklari belgilanib, Daftarga (Lug'at) qo'shilishi mumkin (savol/javob bloklari emas). */
const selectable = (mode: "design" | "play", id: string) => (mode === "play" ? { "data-notebook-text": "", "data-block-id": id } : {});

export function BlockView({ block, mode, attempt, onAnswer }: Props) {
  switch (block.type) {
    case "heading": {
      const size = block.level === 1 ? 76 : block.level === 2 ? 54 : 40;
      return (
        <h2
          className="display h-full w-full"
          // .display qatlamsiz CSS'da uppercase qiladi — Tailwind klassi uni bosolmaydi, shuning uchun inline
          style={{ fontSize: u(size), textAlign: block.align, lineHeight: 1.02, textTransform: block.caps === false ? "none" : undefined }}
          {...selectable(mode, block.id)}
        >
          {block.text || (mode === "design" ? "Sarlavha" : "")}
        </h2>
      );
    }
    case "text":
      return (
        <div className="h-full w-full font-medium leading-snug" style={{ fontSize: u(32), textAlign: block.align }} {...selectable(mode, block.id)}>
          {block.text ? <RichText text={block.text} /> : mode === "design" ? <span className="opacity-40">Matn…</span> : null}
        </div>
      );
    case "callout": {
      const tone = TONES[block.tone] ?? TONES.info;
      return (
        <div
          className={cn("flex h-full w-full flex-col overflow-hidden border-ink", tone.body)}
          style={{ borderWidth: u(4), boxShadow: `${u(8)} ${u(8)} 0 0 var(--color-ink)` }}
        >
          <div
            className={cn("flex shrink-0 items-center border-b-ink font-display font-black uppercase tracking-wide", tone.strip)}
            style={{ gap: u(10), padding: `${u(6)} ${u(16)}`, fontSize: u(20), borderBottomWidth: u(4) }}
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ width: u(26), height: u(26) }}>
              {tone.icon}
            </svg>
            {block.title?.trim() || tone.label}
          </div>
          <div {...selectable(mode, block.id)} className="min-h-0 flex-1 font-semibold leading-snug" style={{ fontSize: u(28), padding: `${u(14)} ${u(20)}` }}>
            {block.text ? <RichText text={block.text} /> : mode === "design" ? <span className="opacity-40">Muhim tushuncha…</span> : null}
          </div>
        </div>
      );
    }
    case "image":
      return block.assetId ? (
        // eslint-disable-next-line @next/next/no-img-element -- ustoz yuklagan rasm, o'lchami noma'lum
        <img src={assetUrl(block.assetId)} alt={block.alt} className="h-full w-full" style={{ objectFit: block.fit }} draggable={false} />
      ) : (
        <Placeholder label="Rasm uchun joy" brief={block.brief} search={block.search} />
      );
    case "audio":
      return (
        <div className="flex h-full w-full flex-col justify-center" style={{ gap: u(10) }}>
          {block.assetId ? (
            <audio controls preload="metadata" src={assetUrl(block.assetId)} className="w-full" style={{ pointerEvents: mode === "design" ? "none" : "auto" }} />
          ) : (
            <Placeholder label="Audio uchun joy" brief={block.brief} search={block.search} />
          )}
          {block.caption ? (
            <p className="font-semibold" style={{ fontSize: u(24) }}>
              {block.caption}
            </p>
          ) : null}
          {block.transcript && mode === "play" ? (
            <details style={{ fontSize: u(22) }}>
              <summary className="cursor-pointer font-bold underline">Matni</summary>
              <p className="mt-1 whitespace-pre-wrap">{block.transcript}</p>
            </details>
          ) : null}
        </div>
      );
    case "grammarRef":
      return <GrammarRefView block={block} mode={mode} />;
    case "choice":
      return mode === "design" ? (
        <ChoiceDesign block={block as ChoiceBlock} />
      ) : (
        <ChoicePlay block={block as Extract<PlayerBlock, { type: "choice" }>} attempt={attempt} onAnswer={onAnswer!} />
      );
    case "fillblank":
      return mode === "design" ? (
        <FillBlankDesign block={block as FillBlankBlock} />
      ) : (
        <FillBlankPlay block={block as Extract<PlayerBlock, { type: "fillblank" }>} attempt={attempt} onAnswer={onAnswer!} />
      );
  }
}

/** Grammatika havolasi: tahrirda tanlangan qoida nomi/tili; o'quvchida ichki havola yoki "mavjud emas" fallback. */
function GrammarRefView({ block, mode }: { block: Block | PlayerBlock; mode: "design" | "play" }) {
  const loc = useLessonLocation();
  const { rules } = useGrammarRules();
  if (block.type !== "grammarRef") return null;
  const frame = { borderWidth: u(4), padding: u(14), boxShadow: `${u(8)} ${u(8)} 0 0 var(--color-ink)`, gap: u(8) };
  const shell = "flex h-full w-full flex-col justify-center border-ink bg-paper";

  if (mode === "design") {
    const info = block.grammarRuleId ? rules?.find((r) => r.id === block.grammarRuleId) : undefined;
    const state = !block.grammarRuleId ? "none" : rules === null ? "loading" : info ? "ok" : "missing";
    return (
      <div className={shell} style={frame} data-testid="grammar-ref-design">
        <p className="label" style={{ fontSize: u(18) }}>
          Grammatika qoidasi
        </p>
        <p className="font-display font-black leading-tight" style={{ fontSize: u(34) }}>
          {state === "ok" && info
            ? info.title
            : state === "none"
              ? "Qoida tanlanmagan"
              : state === "loading"
                ? "Yuklanmoqda…"
                : "Qoida mavjud emas yoki tasdiqlanmagan"}
        </p>
        {state === "ok" && info ? (
          <p className="font-semibold opacity-70" style={{ fontSize: u(22) }}>
            {info.langName}
          </p>
        ) : null}
      </div>
    );
  }

  const rule = "rule" in block ? block.rule : { available: false as const };
  if (!rule.available) {
    return (
      <div className={shell} style={{ ...frame, borderStyle: "dashed" }} data-testid="grammar-ref-unavailable">
        <p className="label" style={{ fontSize: u(18) }}>
          Grammatika qoidasi
        </p>
        <p className="font-semibold" style={{ fontSize: u(26) }}>
          Bu qoida hozircha mavjud emas. Darsni davom ettiring.
        </p>
      </div>
    );
  }
  return (
    <div className={shell} style={frame} data-testid="grammar-ref">
      <p className="label" style={{ fontSize: u(18) }}>
        Grammatika qoidasi · {rule.langName}
      </p>
      <p className="font-display font-black leading-tight" style={{ fontSize: u(34) }}>
        {rule.title}
      </p>
      <div>
        <Link
          href={grammarOpenHref(rule, loc)}
          target={loc?.surface === "preview" ? "_blank" : undefined}
          rel={loc?.surface === "preview" ? "noopener" : undefined}
          className="inline-flex items-center border-ink bg-acid font-display font-black uppercase"
          style={{ borderWidth: u(4), padding: `${u(6)} ${u(14)}`, fontSize: u(20), boxShadow: `${u(5)} ${u(5)} 0 0 var(--color-ink)` }}
        >
          {block.label.trim() || "Qoidani ochish"} →
        </Link>
      </div>
    </div>
  );
}

/** Bo'sh media joyi; ustoz topshirig'i (nima kerak + qidiruv so'zi) bo'lsa shu yerda ko'rinadi. */
function Placeholder({ label, brief, search }: { label: string; brief?: string; search?: string }) {
  const hasBrief = Boolean(brief?.trim() || search?.trim());
  return (
    <div
      className="flex h-full min-h-10 w-full flex-col items-center justify-center overflow-hidden border-dashed border-ink bg-paper-2 text-center"
      style={{ borderWidth: u(3), gap: u(8), padding: u(14) }}
    >
      <p className="font-mono font-bold uppercase opacity-70" style={{ fontSize: u(18) }}>
        {label}
      </p>
      {hasBrief ? (
        <>
          {brief?.trim() ? (
            <p className="font-semibold leading-snug" style={{ fontSize: u(22) }}>
              {brief}
            </p>
          ) : null}
          {search?.trim() ? (
            <p className="border-ink bg-white font-mono leading-snug" style={{ fontSize: u(18), borderWidth: u(2), padding: `${u(4)} ${u(10)}` }}>
              🔎 {search}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

const card = { borderWidth: u(4), padding: u(18) } as const;

function ChoiceDesign({ block }: { block: ChoiceBlock }) {
  return (
    <div className="h-full w-full overflow-hidden border-ink bg-white" style={card}>
      <p className="font-bold leading-snug" style={{ fontSize: u(30) }}>
        {block.question || "Savol matni…"}
      </p>
      <ul className="mt-2 space-y-2" style={{ fontSize: u(26) }}>
        {block.options.map((o) => (
          <li key={o.id} className={cn("flex items-center gap-3 border-ink px-3 py-1.5", block.correctIds.includes(o.id) && "bg-acid")} style={{ borderWidth: u(3) }}>
            <span
              aria-hidden
              className={cn("grid shrink-0 place-items-center border-ink", block.multiple ? "" : "rounded-full")}
              style={{ width: u(26), height: u(26), borderWidth: u(3) }}
            >
              {block.correctIds.includes(o.id) ? "✓" : ""}
            </span>
            {o.text || "Variant"}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FillBlankDesign({ block }: { block: FillBlankBlock }) {
  const parts = block.template.split(BLANK_RE);
  return (
    <div className="h-full w-full overflow-hidden border-ink bg-white font-medium leading-[1.9]" style={{ ...card, fontSize: u(30) }}>
      {parts.map((p, i) =>
        i % 2 === 0 ? (
          <span key={i}>{p}</span>
        ) : (
          <span key={i} className="mx-1 inline-block border-b-[3px] border-ink bg-acid px-3 font-bold">
            {block.blanks.find((b) => b.id === p)?.answers[0] ?? "___"}
          </span>
        ),
      )}
      {!block.template && <span className="opacity-40">Matn va [[1]] bo&apos;sh joy…</span>}
    </div>
  );
}
