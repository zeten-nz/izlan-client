import { cn } from "@/lib/cn";
import { fmtDay } from "./format";

/**
 * Achievement badge'lari: tayyor geometrik dizaynlar (kalit = achievement slug). Tashqi SVG/HTML render qilinmaydi;
 * noma'lum slug uchun xavfsiz umumiy belgi chiziladi.
 */
const ink = "var(--color-ink)";

function Art({ slug }: { slug: string }) {
  const s = { stroke: ink, strokeWidth: 3.5, strokeLinejoin: "miter" as const, strokeLinecap: "square" as const };
  switch (slug) {
    case "birinchi-qadam":
      // Zinapoya va bayroq: yo'lning birinchi pog'onasi
      return (
        <>
          <path d="M8 54h14V42h14V30h14V18" fill="var(--color-acid)" {...s} />
          <path d="M8 54h42V18" fill="none" {...s} />
          <path d="M50 18V6l10 5-10 5" fill="var(--color-tomato)" {...s} />
        </>
      );
    case "bilim-yolida":
      // Yo'l bo'ylab 3 ta nuqta (romb)
      return (
        <>
          <path d="M6 52L22 36l12 10 24-30" fill="none" {...s} strokeDasharray="6 5" />
          <path d="M14 56l-8-8 8-8 8 8z" fill="var(--color-sky)" {...s} />
          <path d="M34 50l-8-8 8-8 8 8z" fill="var(--color-bubble)" {...s} />
          <path d="M56 22l-8-8 8-8 8 8z" fill="var(--color-acid)" {...s} />
        </>
      );
    case "sinov-ustasi":
      // Nishon: ichma-ich kvadratlar va belgi
      return (
        <>
          <rect x="6" y="6" width="52" height="52" fill="#fff" {...s} />
          <rect x="16" y="16" width="32" height="32" fill="var(--color-sky)" {...s} />
          <rect x="26" y="26" width="12" height="12" fill="var(--color-tomato)" {...s} />
          <path d="M40 40l16-16" {...s} />
        </>
      );
    case "intizomli":
      // Kalendar: 7 ta katak
      return (
        <>
          <rect x="6" y="10" width="52" height="46" fill="#fff" {...s} />
          <path d="M6 22h52" {...s} />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x={10 + (i % 4) * 12} y={i < 4 ? 28 : 41} width="9" height="9" fill={i < 5 ? "var(--color-acid)" : "var(--color-bubble)"} stroke={ink} strokeWidth="2.5" />
          ))}
          <path d="M18 5v10M46 5v10" {...s} />
        </>
      );
    case "ilm-fidoyisi":
      // Piramida va yulduz: eng yuqori bag'ishlanish
      return (
        <>
          <path d="M6 56h52L32 22z" fill="var(--color-acid)" {...s} />
          <path d="M18 56l14-20 14 20" fill="none" {...s} />
          <path d="M32 4l4 8h9l-7 6 3 9-9-5-9 5 3-9-7-6h9z" fill="var(--color-tomato)" stroke={ink} strokeWidth="2.5" />
        </>
      );
    default:
      return <path d="M32 6l8 18 20 2-15 13 5 19-18-10-18 10 5-19L4 26l20-2z" fill="var(--color-paper-2)" {...s} />;
  }
}

/** Badge belgisi: olingan (rangli) yoki yopiq (kulrang, qulf). */
export function BadgeArt({ slug, locked = false, className }: { slug: string; locked?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-block shrink-0", className)}>
      <svg viewBox="0 0 64 64" className={cn("size-full", locked && "grayscale opacity-45")} aria-hidden>
        <Art slug={slug} />
      </svg>
      {locked && (
        <svg viewBox="0 0 24 24" aria-hidden className="absolute bottom-0 right-0 size-1/3 border-2 border-ink bg-white p-0.5">
          <path d="M6 11V8a6 6 0 0112 0v3M5 11h14v10H5z" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="square" />
        </svg>
      )}
    </span>
  );
}

export type BadgeItem = {
  slug: string;
  name: string;
  description: string;
  requirement: string;
  earned: boolean;
  earnedAt: string | null;
  showcaseOrder: number | null;
  progress: { value: number; target: number; pct: number } | null;
};

/** Kartochka: olingan sana yoki progress. */
export function BadgeCard({ b, onOpen, selected }: { b: BadgeItem; onOpen?: () => void; selected?: boolean }) {
  const body = (
    <>
      <BadgeArt slug={b.slug} locked={!b.earned} className="size-14 sm:size-16" />
      <span className="min-w-0 flex-1 text-left">
        <span className="block font-display text-base font-black leading-tight [overflow-wrap:anywhere]">{b.name}</span>
        <span className="mt-0.5 block text-xs text-ink/75 [overflow-wrap:anywhere]">{b.description}</span>
        {b.earned ? (
          <span className="label mt-1 block text-[11px]">Olingan: {b.earnedAt ? fmtDay(b.earnedAt) : ""}</span>
        ) : b.progress ? (
          <span className="mt-1.5 block">
            <span className="block h-2.5 border-2 border-ink bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={b.progress.pct}>
              <span className="block h-full bg-acid" style={{ width: `${b.progress.pct}%` }} />
            </span>
            <span className="label mt-1 block text-[11px] tabular-nums">
              {b.progress.value} / {b.progress.target}
            </span>
          </span>
        ) : (
          <span className="label mt-1 block text-[11px]">Hali ochilmagan</span>
        )}
      </span>
    </>
  );
  const cls = cn(
    "flex w-full items-start gap-3 border-[3px] border-ink p-3 shadow-[3px_3px_0_0_var(--color-ink)]",
    b.earned ? "bg-white" : "bg-paper-2",
    selected && "outline-[3px] outline-cobalt",
  );
  return onOpen ? (
    <button type="button" onClick={onOpen} className={cn(cls, "focus-visible:outline-[3px] focus-visible:outline-cobalt")}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}
