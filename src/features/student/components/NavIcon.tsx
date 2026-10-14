export type NavIconId = "home" | "learn" | "progress" | "rewards" | "profile" | "notebook";

/** Navigatsiya piktogrammalari: loyihadagi FeatureIcon uslubida (qalin chiziq, to'g'ri burchak). */
export function NavIcon({ id, className }: { id: NavIconId; className?: string }) {
  const c = { fill: "none", stroke: "currentColor", strokeWidth: 3.5, strokeLinecap: "square" as const, strokeLinejoin: "miter" as const };
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {id === "home" && (
        <>
          <path d="M6 22L24 7l18 15" {...c} />
          <path d="M11 19v22h26V19" {...c} />
          <path d="M20 41V29h8v12" {...c} />
        </>
      )}
      {id === "learn" && (
        <>
          <path d="M6 10h15a3 3 0 013 3v28a3 3 0 00-3-3H6z" {...c} />
          <path d="M42 10H27a3 3 0 00-3 3v28a3 3 0 013-3h15z" {...c} />
        </>
      )}
      {id === "progress" && (
        <>
          <path d="M6 6v36h36" {...c} />
          <path d="M14 32l8-9 6 5 12-15" {...c} />
        </>
      )}
      {id === "rewards" && (
        <>
          <path d="M12 8h24v10a12 12 0 01-24 0z" {...c} />
          <path d="M12 12H5v4a7 7 0 007 7M36 12h7v4a7 7 0 01-7 7" {...c} />
          <path d="M24 30v8M15 41h18" {...c} />
        </>
      )}
      {id === "profile" && (
        <>
          <circle cx="24" cy="16" r="9" {...c} />
          <path d="M7 43c1-10 8-14 17-14s16 4 17 14" {...c} />
        </>
      )}
      {id === "notebook" && (
        <>
          <rect x="9" y="5" width="30" height="38" {...c} />
          <path d="M16 15h16M16 23h16M16 31h9" {...c} />
        </>
      )}
    </svg>
  );
}
