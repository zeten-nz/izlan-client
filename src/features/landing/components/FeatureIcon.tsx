type Props = { id: string; className?: string };

/** Oddiy geometrik piktogrammalar (brutalist uslub: qalin chiziq, to‘g‘ri burchak). */
export function FeatureIcon({ id, className }: Props) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 3.5, strokeLinecap: "square" as const };
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {id === "placement" && (
        <>
          <circle cx="21" cy="21" r="12" {...common} />
          <path d="M30 30l12 12" {...common} />
          <path d="M16 21l4 4 7-8" {...common} />
        </>
      )}
      {id === "roadmap" && (
        <>
          <circle cx="10" cy="38" r="4" {...common} />
          <circle cx="38" cy="10" r="4" {...common} />
          <path d="M14 38h14a6 6 0 006-6v-2a6 6 0 00-6-6H20a6 6 0 01-6-6v-2a6 6 0 016-6h14" {...common} />
        </>
      )}
      {id === "formats" && (
        <>
          <rect x="5" y="5" width="16" height="16" {...common} />
          <circle cx="35" cy="13" r="8" {...common} />
          <path d="M5 43l8-14 8 14z" {...common} />
          <path d="M27 29h16v14H27z" {...common} />
        </>
      )}
      {id === "mistakes" && (
        <>
          <path d="M8 8h32v26H22l-10 8v-8H8z" {...common} />
          <path d="M18 16l12 10M30 16L18 26" {...common} />
        </>
      )}
      {id === "daily" && (
        <>
          <rect x="6" y="9" width="36" height="32" {...common} />
          <path d="M6 19h36M15 4v10M33 4v10" {...common} />
          <path d="M15 29h6M27 29h6M15 35h6" {...common} />
        </>
      )}
      {id === "honest" && (
        <>
          <path d="M24 5v38M10 12h28" {...common} />
          <path d="M10 12L4 28a6 6 0 0012 0zM38 12l-6 16a6 6 0 0012 0z" {...common} />
          <path d="M16 43h16" {...common} />
        </>
      )}
    </svg>
  );
}
