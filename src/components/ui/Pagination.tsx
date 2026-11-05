import { cn } from "@/lib/cn";

const btn = "border-[3px] border-ink bg-white px-3 py-1.5 text-sm font-bold hover:bg-acid disabled:opacity-40";

/** Sahifalar: oldingi/keyingi + raqamlar. Bitta sahifani «…» bilan yashirish ma'nosiz: bo'shliq 2+ sahifa bo'lsagina qisqaradi. */
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const shown = (p: number) => p <= 2 || p >= pages - 1 || Math.abs(p - page) <= 1;
  const nums: (number | "…")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (shown(p) || (shown(p - 1) && shown(p + 1))) nums.push(p);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const go = (p: number) => {
    onPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Sahifalar">
      <button type="button" className={btn} disabled={page === 1} onClick={() => go(page - 1)}>
        ← Oldingi
      </button>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="px-1 font-bold" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            className={cn(btn, "min-w-10", n === page && "bg-ink! text-paper!")}
            aria-current={n === page ? "page" : undefined}
            onClick={() => go(n)}
          >
            {n}
          </button>
        ),
      )}
      <button type="button" className={btn} disabled={page === pages} onClick={() => go(page + 1)}>
        Keyingi →
      </button>
    </nav>
  );
}
