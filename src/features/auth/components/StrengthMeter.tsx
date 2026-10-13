import { PASSWORD_RULES, STRENGTH_LEVELS, passwordStrength } from "@/lib/password";
import { cn } from "@/lib/cn";

const BAR_TONES = ["bg-tomato", "bg-tomato", "bg-bubble", "bg-sky", "bg-acid"] as const;

/** Parol mustahkamligi: 5 bo'lakli chiziq + talablar ro'yxati. */
export function StrengthMeter({ password }: { password: string }) {
  const level = passwordStrength(password);
  const filled = password ? level + 1 : 0;
  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-5 gap-1.5" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={cn("h-3.5 border-[3px] border-ink transition-colors", i < filled ? BAR_TONES[level] : "bg-white")}
            />
          ))}
        </div>
        <span className="label w-[92px] shrink-0 text-right">{password ? STRENGTH_LEVELS[level] : "Parol yo'q"}</span>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(password);
          return (
            <li key={r.id} className={cn("flex items-center gap-2 text-sm", ok ? "font-semibold" : "text-ink/65")}>
              <span
                aria-hidden
                className={cn("grid size-4 shrink-0 place-items-center border-2 border-ink text-[10px] leading-none", ok ? "bg-acid" : "bg-white")}
              >
                {ok ? "✓" : ""}
              </span>
              <span>
                {r.label}
                <span className="sr-only">{ok ? " — bajarilgan" : " — bajarilmagan"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
