import { cn } from "@/lib/cn";

const LAYERS = 14;

/** CSS bilan yasalgan aylanuvchi 3D tanga ("IZL"). Hech qanday kutubxona kerak emas. */
export function Coin3D({ className }: { className?: string }) {
  const face =
    "absolute inset-0 grid place-items-center rounded-full border-[6px] border-ink bg-acid text-ink backface-hidden";
  return (
    <div className={cn("perspective", className)} role="img" aria-label="IZL tangasi">
      <div className="preserve-3d relative mx-auto size-[min(62vw,300px)] animate-coin">
        {/* qalinlik */}
        {Array.from({ length: LAYERS }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute inset-0 rounded-full border-[6px] border-ink bg-tomato"
            style={{ transform: `translateZ(${i - LAYERS / 2}px)` }}
          />
        ))}
        {/* old yuz */}
        <div className={face} style={{ transform: `translateZ(${LAYERS / 2}px)` }}>
          <div className="grid size-[78%] place-items-center rounded-full border-[4px] border-ink">
            <span className="display text-[clamp(56px,13vw,96px)]">IZL</span>
          </div>
        </div>
        {/* orqa yuz */}
        <div className={face} style={{ transform: `rotateY(180deg) translateZ(${LAYERS / 2}px)` }}>
          <div className="grid size-[78%] place-items-center rounded-full border-[4px] border-ink">
            <span className="serif-i text-[clamp(60px,14vw,110px)] leading-none text-ink">i</span>
          </div>
        </div>
      </div>
    </div>
  );
}
