"use client";

import Link from "next/link";
import { RichText } from "@/lib/rich";
import { cn } from "@/lib/cn";
import {
  assetUrl,
  BLANK_RE,
  type AnswerResult,
  type AttemptView,
  type Block,
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

const TONES = {
  info: "bg-sky",
  warning: "bg-acid",
  success: "bg-[#8df0a8]",
} as const;

/** O'quvchi pleerida matn bloklari belgilanib, Daftarga (Lug'at) qo'shilishi mumkin (savol/javob bloklari emas). */
const selectable = (mode: "design" | "play", id: string) => (mode === "play" ? { "data-notebook-text": "", "data-block-id": id } : {});

export function BlockView({ block, mode, attempt, onAnswer }: Props) {
  switch (block.type) {
    case "heading": {
      const size = block.level === 1 ? 76 : block.level === 2 ? 54 : 40;
      return (
        <h2 className="display h-full w-full" style={{ fontSize: u(size), textAlign: block.align, lineHeight: 1.02 }} {...selectable(mode, block.id)}>
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
    case "callout":
      return (
        <div
          {...selectable(mode, block.id)}
          className={cn("h-full w-full border-ink font-semibold leading-snug", TONES[block.tone])}
          style={{ fontSize: u(30), borderWidth: u(4), padding: u(20), boxShadow: `${u(8)} ${u(8)} 0 0 var(--color-ink)` }}
        >
          {block.text ? <RichText text={block.text} /> : mode === "design" ? <span className="opacity-40">Muhim tushuncha…</span> : null}
        </div>
      );
    case "image":
      return block.assetId ? (
        // eslint-disable-next-line @next/next/no-img-element -- ustoz yuklagan rasm, o'lchami noma'lum
        <img src={assetUrl(block.assetId)} alt={block.alt} className="h-full w-full" style={{ objectFit: block.fit }} draggable={false} />
      ) : (
        <Placeholder label="Rasm tanlanmagan" />
      );
    case "audio":
      return (
        <div className="flex h-full w-full flex-col justify-center" style={{ gap: u(10) }}>
          {block.assetId ? (
            <audio controls preload="metadata" src={assetUrl(block.assetId)} className="w-full" style={{ pointerEvents: mode === "design" ? "none" : "auto" }} />
          ) : (
            <Placeholder label="Audio tanlanmagan" />
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

function Placeholder({ label }: { label: string }) {
  return (
    <div
      className="grid h-full min-h-10 w-full place-items-center border-dashed border-ink bg-paper-2 font-mono font-bold uppercase opacity-70"
      style={{ borderWidth: u(3), fontSize: u(20) }}
    >
      {label}
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
