import { cn } from "@/lib/cn";

/**
 * "Qanday ishlaydi" kartalaridagi kichik interfeys namunalari.
 * Hammasi sof JSX/CSS: rasm yo‘q, tez yuklanadi. Bu NAMUNA, real ma’lumot emas.
 */

const frame = "border-[3px] border-ink bg-paper p-4 shadow-[5px_5px_0_0_var(--color-ink)] text-ink";

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="label absolute -top-3 right-3 border-[3px] border-ink bg-ink px-2 py-0.5 text-paper">{children}</span>;
}

export function TestVisual() {
  const options = ["am", "is", "are"];
  return (
    <div className={cn(frame, "relative w-full max-w-sm")}>
      <Tag>Namuna</Tag>
      <p className="label mb-3 text-ink/60">Savol 4</p>
      <p className="mb-4 text-xl font-bold">She ___ a student.</p>
      <div className="grid gap-2.5">
        {options.map((o) => (
          <div
            key={o}
            className={cn(
              "border-[3px] border-ink px-4 py-2.5 font-bold",
              o === "is" ? "bg-acid shadow-[3px_3px_0_0_var(--color-ink)]" : "bg-paper",
            )}
          >
            {o}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RoadmapVisual() {
  const nodes = [
    { t: "Verb “to be”", s: "done" },
    { t: "Present simple", s: "done" },
    { t: "There is / there are", s: "now" },
    { t: "Food & drinks", s: "todo" },
  ] as const;
  return (
    <div className={cn(frame, "relative w-full max-w-sm")}>
      <Tag>Namuna</Tag>
      <ol className="relative space-y-4 pl-8">
        <span className="absolute bottom-3 left-[11px] top-3 w-[3px] bg-ink" aria-hidden />
        {nodes.map((n) => (
          <li key={n.t} className="relative flex items-center justify-between gap-3">
            <span
              className={cn(
                "absolute -left-8 grid size-6 place-items-center border-[3px] border-ink",
                n.s === "done" && "bg-ink text-acid",
                n.s === "now" && "bg-acid",
                n.s === "todo" && "bg-paper",
              )}
              aria-hidden
            >
              {n.s === "done" && (
                <svg viewBox="0 0 12 12" className="size-3">
                  <path d="M2 6.5l2.6 2.6L10 3" fill="none" stroke="currentColor" strokeWidth="2.4" />
                </svg>
              )}
            </span>
            <span className={cn("font-bold", n.s === "todo" && "text-ink/50")}>{n.t}</span>
            {n.s === "now" && <span className="label bg-acid px-1.5">Hozir</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function LessonVisual() {
  const kinds = ["Tanlash", "Juftlash", "Tartiblash", "Tinglash", "O‘qish"];
  const words = ["student", "I", "a", "am"];
  return (
    <div className={cn(frame, "relative w-full max-w-sm")}>
      <Tag>Namuna</Tag>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {kinds.map((k, i) => (
          <span key={k} className={cn("label border-[3px] border-ink px-2 py-1", i === 2 ? "bg-ink text-paper" : "bg-paper")}>
            {k}
          </span>
        ))}
      </div>
      <p className="mb-3 text-sm font-bold">So‘zlarni to‘g‘ri tartibga qo‘ying:</p>
      <div className="mb-4 flex min-h-12 flex-wrap items-center gap-2 border-[3px] border-dashed border-ink p-2">
        {["I", "am"].map((w) => (
          <span key={w} className="border-[3px] border-ink bg-acid px-3 py-1 font-bold">
            {w}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {words
          .filter((w) => w !== "I" && w !== "am")
          .map((w) => (
            <span key={w} className="border-[3px] border-ink bg-paper px-3 py-1 font-bold shadow-[3px_3px_0_0_var(--color-ink)]">
              {w}
            </span>
          ))}
      </div>
    </div>
  );
}

export function MistakeVisual() {
  return (
    <div className={cn(frame, "relative w-full max-w-sm")}>
      <Tag>Namuna</Tag>
      <p className="label mb-2 text-ink/60">Siz yozdingiz</p>
      <p className="mb-4 text-lg font-bold text-ink/50 line-through decoration-tomato decoration-[3px]">She are happy.</p>
      <p className="label mb-2 text-ink/60">To‘g‘risi</p>
      <p className="mb-4 border-[3px] border-ink bg-acid px-3 py-2 text-lg font-bold">She is happy.</p>
      <p className="border-l-[6px] border-ink pl-3 text-sm leading-snug">
        <b>Nega?</b> “She” bilan <b>is</b> ishlatiladi. “Are” faqat we / you / they bilan keladi.
      </p>
      <p className="label mt-4 inline-block bg-tomato px-2 py-1">Mavzu ertaga qaytadi</p>
    </div>
  );
}

export function ProgressVisual() {
  const rows = [
    { t: "Verb “to be”", v: 90 },
    { t: "Present simple", v: 60 },
    { t: "Food & drinks", v: 25 },
  ];
  return (
    <div className={cn(frame, "relative w-full max-w-sm")}>
      <Tag>Namuna</Tag>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.t}>
            <div className="mb-1 flex justify-between text-sm font-bold">
              <span>{r.t}</span>
              <span className="label">{r.v}%</span>
            </div>
            <div className="h-4 border-[3px] border-ink bg-paper">
              <div className="h-full bg-ink" style={{ width: `${r.v}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <span className="display bg-acid px-2 py-1 text-xl">+120 XP</span>
        <span className="display bg-tomato px-2 py-1 text-xl">+3 IZL</span>
      </div>
    </div>
  );
}
