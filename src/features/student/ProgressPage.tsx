import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/cn";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";
import { DirectionsPanel } from "./components/DirectionsPanel";
import { btn } from "./components/LessonCards";
import { OnboardingHost } from "./components/OnboardingHost";
import { OnboardingTrigger } from "./components/OnboardingTrigger";
import type { CatalogDirection, MistakeGroup, Overview, ProgressSummary } from "./types";

export type ProgressTab = "jarayon" | "xarita";

const TABS: { id: ProgressTab; label: string; hint: string }[] = [
  { id: "jarayon", label: "Jarayon", hint: "Natijalaringiz" },
  { id: "xarita", label: "Xarita", hint: "O'quv yo'lingiz" },
];

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))}-${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

function Block({ id, sticker, title, children }: { id: string; sticker: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-h`} className="border-[3px] border-ink bg-white p-5 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-7">
      <span className="label inline-block -rotate-1 border-[3px] border-ink bg-acid px-2.5 py-1">{sticker}</span>
      <h2 id={`${id}-h`} className="display-cond mt-3 mb-5 text-[clamp(26px,3.5vw,38px)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Faollik: haqiqiy vaqt belgilaridan (javob, boshlash, tugatish). Vaqt sarfi kuzatilmaydi — ko'rsatilmaydi. */
function Activity({ a }: { a: ProgressSummary["activity"] }) {
  const max = Math.max(1, ...a.days.map((d) => d.events));
  return (
    <Block id="faollik" sticker="Faollik" title="Oxirgi 4 hafta">
      <div className="grid gap-3 sm:grid-cols-3">
        <p className="label border-[3px] border-ink bg-paper px-3 py-2">7 kunda: <b data-testid="active7">{a.activeDays7}</b> faol kun</p>
        <p className="label border-[3px] border-ink bg-paper px-3 py-2">28 kunda: <b>{a.activeDays28}</b> faol kun</p>
        <p className="label border-[3px] border-ink bg-paper px-3 py-2">Ketma-ket: <b data-testid="streak">{a.streak}</b> kun</p>
      </div>
      <div
        role="img"
        aria-label={`Oxirgi 28 kunlik faollik: ${a.activeDays28} ta faol kun, ketma-ket ${a.streak} kun`}
        className="mt-5 flex h-28 items-end gap-1 border-b-[3px] border-ink"
      >
        {a.days.map((d) => (
          <div key={d.date} title={`${dayLabel(d.date)}: ${d.events} ta hodisa`} className="flex h-full flex-1 items-end">
            <div
              className={cn("w-full border-2 border-ink", d.events > 0 ? "bg-acid" : "border-ink/20 bg-transparent")}
              style={{ height: d.events > 0 ? `${Math.max(12, Math.round((d.events / max) * 100))}%` : "4px" }}
            />
          </div>
        ))}
      </div>
      <p className="label mt-2 flex justify-between text-ink/60">
        <span>{dayLabel(a.days[0].date)}</span>
        <span>{dayLabel(a.days[a.days.length - 1].date)}</span>
      </p>
      <p className="mt-3 text-sm leading-snug text-ink/70">Faol kun — shu kuni dars boshlangan, javob berilgan yoki dars tugatilgan kun (Toshkent vaqti).</p>
    </Block>
  );
}

function Results({ s }: { s: ProgressSummary }) {
  return (
    <Block id="natijalar" sticker="Darslar" title="Dars natijalari">
      <p className="label mb-4">
        Jami tugatilgan darslar: <b data-testid="lessons-done">{s.totals.lessonsCompleted}</b>
      </p>
      {s.directions.length === 0 ? (
        <p className="text-lg">Yo&apos;nalish tanlanmagan.</p>
      ) : (
        <div className="space-y-6">
          {s.directions.map((d) => (
            <div key={d.directionId}>
              <h3 className="display-cond text-2xl">
                {d.title}
                {d.levelCode ? <span className="label ml-3 border-2 border-ink bg-paper px-2 py-0.5">{d.levelCode}</span> : null}
              </h3>
              {d.levelCode === null ? (
                <p className="mt-2">Daraja hali aniqlanmagan.</p>
              ) : (
                <>
                  <p className="label mt-2">
                    {d.lessonsCompleted} / {d.lessonsTotal} dars tugatildi · {d.topicsCompleted} / {d.topicsTotal} mavzu yakunlandi
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {d.topics.map((t) => {
                      const c = t.lessons;
                      const open = t.state === "open" || t.state === "current";
                      return (
                        <li key={t.id} className={cn("flex items-center gap-3 border-[3px] px-3 py-2", open ? "border-ink bg-paper" : "border-ink/25 text-ink/55")}>
                          <span className="grid size-7 shrink-0 place-items-center border-2 border-ink/60 font-mono text-xs font-bold">{t.ord}</span>
                          <span className="min-w-0 flex-1 font-semibold leading-tight">{t.title}</span>
                          <span className="label shrink-0 text-[11px]">
                            {!open ? "Qulflangan" : c?.contentPreparing ? "Kontent tayyorlanmoqda" : c?.topicCompleted ? "Yakunlandi ✓" : `${c?.completed ?? 0} / ${c?.total ?? 0}`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Block>
  );
}

/** Bilim: faqat haqiqiy xatolardan. O'zlashtirish foizi hisoblanmaydi (dars tugatilishi bilim emas). */
function Knowledge({ groups }: { groups: MistakeGroup[] }) {
  const top = groups.slice(0, 4);
  return (
    <Block id="bilim" sticker="Bilim" title="Ko'proq mashq talab qiladi">
      {top.length === 0 ? (
        <p className="text-lg">Hozircha xatolar yo&apos;q. Xatolar to&apos;plana boshlasa, eng ko&apos;p mashq talab qiladigan mavzular shu yerda ko&apos;rinadi.</p>
      ) : (
        <ul className="space-y-3">
          {top.map((g) => (
            <li key={g.ruleKey} className="flex flex-wrap items-center justify-between gap-3 border-[3px] border-ink bg-paper px-4 py-3">
              <span className="min-w-0">
                <span className="block font-bold leading-tight">{g.title}</span>
                <span className="label mt-1 block">{g.topic.levelCode} · {g.topic.title}</span>
              </span>
              <span className="label border-2 border-ink bg-tomato px-2 py-1">{g.total} marta xato</span>
            </li>
          ))}
        </ul>
      )}
      <Link href={`${ROUTES.student}/notebook`} className={cn(btn, "mt-5 bg-white")}>
        Daftarni ochish →
      </Link>
    </Block>
  );
}

/** Jarayon sahifasi: ichki bo'limlar Jarayon (standart) va Xarita. */
export async function ProgressPage({ tab }: { tab: ProgressTab }) {
  await requireRole("STUDENT");
  const [overview, catalog, summary, mistakes] = await Promise.all([
    apiGet<Overview>("/learning/overview"),
    apiGet<CatalogDirection[]>("/learning/catalog"),
    apiGet<ProgressSummary>("/learning/progress"),
    apiGet<{ groups: MistakeGroup[] }>("/learning/mistakes"),
  ]);
  const hasDirections = overview.directions.length > 0;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-8 sm:py-10">
      <OnboardingHost catalog={catalog} directions={overview.directions} autoOpen={false} />
      <p className="label">Jarayon</p>
      <h1 className="display mt-2 text-[clamp(32px,5vw,60px)]">
        {tab === "xarita" ? "O'quv xaritasi" : "Natijalaringiz"}
      </h1>

      <div role="tablist" aria-label="Jarayon bo'limlari" className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "jarayon" ? `${ROUTES.student}/progress` : `${ROUTES.student}/progress?tab=xarita`}
            role="tab"
            aria-selected={t.id === tab}
            className={cn("label border-[3px] border-ink px-4 py-2.5", t.id === tab ? "bg-ink text-paper shadow-[3px_3px_0_0_var(--color-acid)]" : "bg-white hover:bg-acid")}
          >
            {t.label} <span className="hidden opacity-60 sm:inline">· {t.hint}</span>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {!hasDirections ? (
          <div className="border-[3px] border-dashed border-ink bg-white p-6 sm:p-8">
            <p className="display-cond text-2xl sm:text-3xl">Avval yo&apos;nalish tanlang</p>
            <p className="mt-2 max-w-xl text-lg leading-snug">Yo&apos;nalish tanlagach, natijalaringiz va o&apos;quv xaritangiz shu yerda ko&apos;rinadi.</p>
            <OnboardingTrigger request={{ step: "pick" }} className={`${btn} mt-4 bg-acid`}>
              Yo&apos;nalish tanlash →
            </OnboardingTrigger>
          </div>
        ) : tab === "xarita" ? (
          <DirectionsPanel directions={overview.directions} />
        ) : (
          <div className="grid gap-6">
            <Activity a={summary.activity} />
            <Results s={summary} />
            <Knowledge groups={mistakes.groups} />
          </div>
        )}
      </div>
    </div>
  );
}
