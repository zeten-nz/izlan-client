import { cn } from "@/lib/cn";

type Props = {
  /** Aylana bo‘ylab yoziladigan matn (takrorlanadi) */
  text: string;
  className?: string;
  /** Markazdagi belgi */
  center?: string;
};

/** Aylanuvchi doiraviy yorliq (SVG textPath). */
export function RotatingBadge({ text, className, center = "→" }: Props) {
  const id = `badge-${text.length}-${center.length}`;
  const ring = `${text} ✱ ${text} ✱ `;
  return (
    <div
      className={cn(
        "relative grid size-32 place-items-center rounded-full border-[3px] border-ink bg-acid shadow-[4px_4px_0_0_var(--color-ink)] md:size-40",
        className,
      )}
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 animate-spin-slow" aria-hidden>
        <defs>
          <path id={id} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text className="fill-ink" style={{ fontFamily: "var(--font-space-mono)", fontSize: 15.5, fontWeight: 700, letterSpacing: 2 }}>
          <textPath href={`#${id}`} textLength="486">
            {ring}
          </textPath>
        </text>
      </svg>
      <span className="display text-4xl md:text-5xl" aria-hidden>
        {center}
      </span>
    </div>
  );
}
