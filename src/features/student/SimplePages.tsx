import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/cn";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";
import { btn } from "./components/LessonCards";
import { OnboardingHost } from "./components/OnboardingHost";
import { OnboardingTrigger } from "./components/OnboardingTrigger";
import type { CatalogDirection, Overview } from "./types";

const MAX_DIRECTIONS = 2;
const shell = "mx-auto max-w-[1180px] px-4 py-8 sm:px-8 sm:py-10";

function Head({ label, title }: { label: string; title: string }) {
  return (
    <>
      <p className="label">{label}</p>
      <h1 className="display mt-2 text-[clamp(32px,5vw,60px)]">{title}</h1>
    </>
  );
}

/** Yo'nalishlar: fan → daraja → mavzu → dars. */
export async function DirectionsPage() {
  await requireRole("STUDENT");
  const [overview, catalog] = await Promise.all([apiGet<Overview>("/learning/overview"), apiGet<CatalogDirection[]>("/learning/catalog")]);
  return (
    <div className={shell}>
      <OnboardingHost catalog={catalog} directions={overview.directions} autoOpen={false} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Head label="Yo'nalishlar" title="Fanlar va mavzular" />
        </div>
        {overview.directions.length < MAX_DIRECTIONS && (
          <OnboardingTrigger request={{ step: "pick" }} className={`${btn} bg-white`}>
            + Yo&apos;nalish qo&apos;shish
          </OnboardingTrigger>
        )}
      </div>

      {overview.directions.length === 0 ? (
        <div className="mt-8 border-[3px] border-dashed border-ink bg-white p-6 sm:p-8">
          <p className="display-cond text-2xl sm:text-3xl">Yo&apos;nalish tanlanmagan</p>
          <OnboardingTrigger request={{ step: "pick" }} className={`${btn} mt-4 bg-acid`}>
            Yo&apos;nalish tanlash →
          </OnboardingTrigger>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {overview.directions.map((d) => {
            const current = d.levels.find((l) => l.state === "current");
            return (
              <section key={d.directionId} className="border-[3px] border-ink bg-white p-5 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-7">
                <h2 className="display-cond text-3xl">{d.title}</h2>
                <ol className="mt-4 flex flex-wrap gap-2" aria-label="Darajalar">
                  {d.levels.map((l) => (
                    <li
                      key={l.code}
                      className={cn(
                        "label border-[3px] border-ink px-3 py-1.5",
                        l.state === "current" ? "bg-acid shadow-[3px_3px_0_0_var(--color-ink)]" : l.state === "done" ? "bg-sky" : "bg-paper-2 text-ink/60",
                      )}
                    >
                      {l.code}
                      {l.state === "done" ? " ✓" : l.state === "locked" ? " · qulf" : ""}
                    </li>
                  ))}
                </ol>
                {d.currentLevelOrd === null || !current ? (
                  <div className="mt-6">
                    <p className="text-lg">Darajangiz hali aniqlanmagan.</p>
                    <OnboardingTrigger request={{ step: "mode", directionId: d.directionId }} className={`${btn} mt-3 bg-acid`}>
                      Darajani tanlash →
                    </OnboardingTrigger>
                  </div>
                ) : (
                  <>
                    <p className="label mt-6">
                      {current.code} · {current.title} — mavzular
                    </p>
                    <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                      {current.topics.map((t) => {
                        const paywalled = !!t.paywalled && (t.state === "open" || t.state === "current");
                        const open = (t.state === "open" || t.state === "current") && !paywalled;
                        const c = t.lessons;
                        const status = paywalled ? "Pullik · sotib olish →" : !open ? "Qulflangan" : c?.contentPreparing ? "Kontent tayyorlanmoqda" : c?.topicCompleted ? "Yakunlandi" : `${c?.completed ?? 0} / ${c?.total ?? 0} dars`;
                        const body = (
                          <>
                            <span className="grid size-7 shrink-0 place-items-center border-2 border-ink/60 font-mono text-xs font-bold">{t.ord}</span>
                            {/* Mobilda holat sarlavha ostida: yonma-yon turganda sarlavha 3 qatorga sinardi (UI-06) */}
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold leading-tight">{t.title}</span>
                              <span className="label mt-1 block text-[11px] sm:hidden">{status}</span>
                            </span>
                            <span className="label hidden shrink-0 text-[11px] sm:inline">{status}</span>
                          </>
                        );
                        return (
                          <li key={t.id}>
                            {paywalled ? (
                              <Link
                                href={`${ROUTES.student}/balance?buy=${d.directionId}`}
                                className="flex items-center gap-3 border-[3px] border-dashed border-ink bg-paper px-3 py-2.5 hover:-translate-y-0.5 hover:bg-acid/40"
                              >
                                {body}
                              </Link>
                            ) : open ? (
                              <Link
                                href={`${ROUTES.student}/topic/${t.id}`}
                                className={cn("flex items-center gap-3 border-[3px] border-ink px-3 py-2.5 hover:-translate-y-0.5", t.state === "current" ? "bg-acid" : "bg-paper")}
                              >
                                {body}
                              </Link>
                            ) : (
                              <div aria-disabled className="flex items-center gap-3 border-[3px] border-ink/25 px-3 py-2.5 text-ink/55">
                                {body}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

