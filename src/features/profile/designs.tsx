import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Cosmetic, CosmeticKind } from "./types";

/**
 * Tasdiqlangan kosmetik dizaynlar registri. Server (server/src/profile/cosmetic-registry.ts) shu kalitlarni tekshiradi;
 * ikkala ro'yxat bir xil bo'lishi shart. Dizayn faqat shu yerdagi kod bilan chiziladi: ma'lumotdan HTML/SVG/CSS olinmaydi.
 */
export const DESIGNS = {
  "ramka-minimal": { kind: "FRAME", label: "Minimal" },
  "ramka-neon": { kind: "FRAME", label: "Neon" },
  "ramka-koinot": { kind: "FRAME", label: "Koinot" },
  "ramka-oltin-meros": { kind: "FRAME", label: "Oltin meros" },
  "banner-izlanuvchi": { kind: "BANNER", label: "Izlanuvchi" },
  "banner-bilim-tolqini": { kind: "BANNER", label: "Bilim to'lqini" },
  "banner-ilm-galaktikasi": { kind: "BANNER", label: "Ilm galaktikasi" },
  "banner-afsonaviy-tafakkur": { kind: "BANNER", label: "Afsonaviy tafakkur" },
  "unvon-yangi-izlanuvchi": { kind: "TITLE", label: "Yangi izlanuvchi" },
  "unvon-bilimdon": { kind: "TITLE", label: "Bilimdon" },
  "unvon-ilm-kashfiyotchisi": { kind: "TITLE", label: "Ilm kashfiyotchisi" },
  "unvon-bilim-afsonasi": { kind: "TITLE", label: "Bilim afsonasi" },
} as const satisfies Record<string, { kind: CosmeticKind; label: string }>;

export type DesignKey = keyof typeof DESIGNS;
export const DESIGN_KEYS = Object.keys(DESIGNS) as DesignKey[];
export const designsOfKind = (kind: CosmeticKind) => DESIGN_KEYS.filter((k) => DESIGNS[k].kind === kind);

const GOLD = "#f2b705";

/** Bezakning ro'yxatdagi to'g'ri dizayn kaliti; noma'lum/noto'g'ri tur bo'lsa null (chaqiruvchi xavfsiz fallback chizadi). */
export function designKeyOf(item: { preview: { key?: string } | null } | null | undefined, kind: CosmeticKind): DesignKey | null {
  const k = item?.preview?.key;
  if (typeof k !== "string" || !Object.prototype.hasOwnProperty.call(DESIGNS, k)) return null;
  return DESIGNS[k as DesignKey].kind === kind ? (k as DesignKey) : null;
}

const abs = "pointer-events-none absolute";
const corner = (pos: string, cls: string): ReactNode => <span className={cn(abs, "size-2.5 border-2 border-ink", pos, cls)} />;

/** Avatar atrofidagi ramka (avatar tashqarisida, -inset bilan). Har dizayn alohida geometriya. */
export function FrameArt({ k }: { k: DesignKey }) {
  switch (k) {
    case "ramka-minimal":
      return (
        <>
          <span aria-hidden className={cn(abs, "-inset-1.5 border-2 border-ink")} />
          <span aria-hidden className={cn(abs, "-inset-[11px] border border-ink/60")} />
        </>
      );
    case "ramka-neon":
      return (
        <>
          <span aria-hidden className={cn(abs, "-inset-2 border-[3px] border-cobalt")} style={{ boxShadow: "3px 3px 0 0 var(--color-ink)" }} />
          <span aria-hidden>
            {corner("-left-[13px] -top-[13px]", "bg-acid")}
            {corner("-right-[13px] -top-[13px]", "bg-acid")}
            {corner("-bottom-[13px] -left-[13px]", "bg-acid")}
            {corner("-bottom-[13px] -right-[13px]", "bg-acid")}
          </span>
        </>
      );
    case "ramka-koinot":
      return (
        <>
          <span aria-hidden className={cn(abs, "-inset-2 border-2 border-dashed border-cobalt")} />
          <span aria-hidden className={cn(abs, "-inset-1 border-2 border-ink")} />
          <span aria-hidden>
            <span className={cn(abs, "-left-[15px] -top-[15px] size-3 rotate-45 border-2 border-ink bg-bubble")} />
            <span className={cn(abs, "-right-[15px] -top-[15px] size-3 rotate-45 border-2 border-ink bg-acid")} />
            <span className={cn(abs, "-bottom-[15px] -left-[15px] size-3 rotate-45 border-2 border-ink bg-acid")} />
            <span className={cn(abs, "-bottom-[15px] -right-[15px] size-3 rotate-45 border-2 border-ink bg-sky")} />
          </span>
        </>
      );
    case "ramka-oltin-meros":
      return (
        <>
          <span
            aria-hidden
            className={cn(abs, "-inset-2.5 border-[5px]")}
            style={{ borderColor: GOLD, boxShadow: "inset 0 0 0 2px var(--color-ink), 0 0 0 2px var(--color-ink)" }}
          />
          <span aria-hidden>
            {[
              "-left-[17px] -top-[17px]",
              "-right-[17px] -top-[17px]",
              "-bottom-[17px] -left-[17px]",
              "-bottom-[17px] -right-[17px]",
            ].map((p) => (
              <span key={p} className={cn(abs, "size-3.5 border-2 border-ink", p)} style={{ background: GOLD }} />
            ))}
            <span
              className={cn(abs, "-top-[30px] left-1/2 h-[22px] w-10 -translate-x-1/2")}
              style={{ background: "var(--color-ink)", clipPath: "polygon(0 100%, 0 12%, 25% 55%, 50% 0, 75% 55%, 100% 12%, 100% 100%)" }}
            />
            <span
              className={cn(abs, "-top-[26px] left-1/2 h-4 w-8 -translate-x-1/2")}
              style={{ background: GOLD, clipPath: "polygon(0 100%, 0 20%, 25% 60%, 50% 0, 75% 60%, 100% 20%, 100% 100%)" }}
            />
          </span>
        </>
      );
  }
}

const bannerBase = "absolute inset-0 h-full w-full";

/** Banner naqshi (600x150, "slice": har qanday nisbatda kesiladi). */
export function BannerArt({ k }: { k: DesignKey }) {
  const common = { viewBox: "0 0 600 150", preserveAspectRatio: "xMidYMid slice", className: bannerBase, "aria-hidden": true } as const;
  switch (k) {
    case "banner-izlanuvchi":
      return (
        <svg {...common}>
          <rect width="600" height="150" fill="var(--color-acid)" />
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d={`M${i * 60 - 40} 150L${i * 60 + 40} 0`} stroke="var(--color-ink)" strokeWidth="2" opacity=".18" />
          ))}
          <circle cx="470" cy="62" r="34" fill="none" stroke="var(--color-ink)" strokeWidth="9" />
          <path d="M495 88l36 36" stroke="var(--color-ink)" strokeWidth="12" strokeLinecap="square" />
          <circle cx="470" cy="62" r="14" fill="var(--color-paper)" opacity=".7" />
        </svg>
      );
    case "banner-bilim-tolqini":
      return (
        <svg {...common}>
          <rect width="600" height="150" fill="var(--color-sky)" />
          <path d="M0 100Q75 60 150 100T300 100T450 100T600 100V150H0z" fill="var(--color-cobalt)" opacity=".85" />
          <path d="M0 118Q75 80 150 118T300 118T450 118T600 118V150H0z" fill="var(--color-ink)" />
          <path d="M0 78Q75 38 150 78T300 78T450 78T600 78" fill="none" stroke="var(--color-ink)" strokeWidth="5" />
          <path d="M0 52Q75 14 150 52T300 52T450 52T600 52" fill="none" stroke="var(--color-paper)" strokeWidth="4" />
        </svg>
      );
    case "banner-ilm-galaktikasi":
      return (
        <svg {...common}>
          <rect width="600" height="150" fill="var(--color-ink)" />
          <ellipse cx="400" cy="75" rx="220" ry="48" fill="none" stroke="var(--color-cobalt)" strokeWidth="4" transform="rotate(-14 400 75)" />
          <ellipse cx="400" cy="75" rx="150" ry="30" fill="none" stroke="var(--color-bubble)" strokeWidth="3" strokeDasharray="10 8" transform="rotate(-14 400 75)" />
          <circle cx="400" cy="75" r="22" fill="var(--color-acid)" stroke="var(--color-paper)" strokeWidth="3" />
          {[[40, 30], [90, 110], [150, 50], [210, 120], [270, 24], [320, 96], [540, 30], [570, 120], [500, 100], [120, 80]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width={i % 3 === 0 ? 7 : 4} height={i % 3 === 0 ? 7 : 4} fill="var(--color-paper)" />
          ))}
        </svg>
      );
    case "banner-afsonaviy-tafakkur":
      return (
        <svg {...common}>
          <rect width="600" height="150" fill={GOLD} />
          {Array.from({ length: 18 }, (_, i) => (
            <path key={i} d={`M300 150L${-300 + i * 70} 0L${-265 + i * 70} 0z`} fill="var(--color-paper)" opacity=".35" />
          ))}
          <path d="M0 150V118l30-22 30 22 30-22 30 22 30-22 30 22 30-22 30 22 30-22 30 22 30-22 30 22 30-22 30 22 30-22 30 22 30-22 30 22 30-22 30 22 30-22 30 22V150z" fill="var(--color-ink)" />
          <circle cx="300" cy="62" r="26" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth="6" />
          <circle cx="300" cy="62" r="9" fill="var(--color-ink)" />
        </svg>
      );
    default:
      return null;
  }
}

/** Unvon: ism yonida chiqadigan nishon (har dizayn alohida uslub). */
export function TitleArt({ k, label, className }: { k: DesignKey; label: string; className?: string }) {
  const base = "inline-flex max-w-full items-center gap-1 border-2 border-ink px-2 py-0.5 text-[11px] font-black uppercase leading-tight tracking-tight";
  const text = <span className="min-w-0 truncate">{label}</span>;
  const style: Record<string, { cls: string; style?: CSSProperties; pre?: string }> = {
    "unvon-yangi-izlanuvchi": { cls: "bg-paper-2" },
    "unvon-bilimdon": { cls: "bg-sky text-ink shadow-[2px_2px_0_0_var(--color-cobalt)]", pre: "◆" },
    "unvon-ilm-kashfiyotchisi": { cls: "bg-bubble shadow-[3px_3px_0_0_var(--color-ink)]", pre: "★" },
    "unvon-bilim-afsonasi": { cls: "bg-ink text-acid shadow-[3px_3px_0_0_#f2b705] ring-2 ring-[#f2b705] ring-offset-0", pre: "♛" },
  };
  const s = style[k];
  if (!s) return null;
  return (
    <span className={cn(base, s.cls, className)}>
      {s.pre && <span aria-hidden>{s.pre}</span>}
      {text}
    </span>
  );
}

/** Katalog kartasi uchun kichik thumbnail. */
export function CosmeticThumb({ item, initials, className }: { item: Cosmetic; initials: string; className?: string }) {
  const k = designKeyOf(item, item.kind);
  if (!k) return <div aria-hidden className={cn("grid h-14 w-full place-items-center border-2 border-dashed border-ink/50 text-xs text-ink/50", className)}>?</div>;
  if (item.kind === "FRAME")
    return (
      <div aria-hidden className={cn("grid h-14 w-full place-items-center bg-paper-2", className)}>
        <span className="relative m-2 inline-block border-[3px] border-ink">
          <span className="grid size-9 place-items-center bg-ink font-display text-sm font-black text-paper">{initials}</span>
          <FrameArt k={k} />
        </span>
      </div>
    );
  if (item.kind === "BANNER")
    return (
      <div aria-hidden className={cn("relative h-14 w-full overflow-hidden border-2 border-ink", className)}>
        <BannerArt k={k} />
      </div>
    );
  return (
    <div aria-hidden className={cn("grid h-14 w-full place-items-center bg-paper-2 px-2", className)}>
      <TitleArt k={k} label={item.name} />
    </div>
  );
}
