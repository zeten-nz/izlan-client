import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES } from "@/config/routes";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";
import { btn, ContinueCard, NextLessonList } from "./components/LessonCards";
import { OnboardingHost } from "./components/OnboardingHost";
import { OnboardingTrigger } from "./components/OnboardingTrigger";
import { ReviewPanel } from "./components/ReviewPanel";
import type { CatalogDirection, MistakeGroup, NextLessons, Overview, ProgressSummary } from "./types";

const MAX_DIRECTIONS = 2;

function Section({ id, sticker, title, children }: { id: string; sticker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32">
      <span className="label inline-block -rotate-2 border-[3px] border-ink bg-white px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">{sticker}</span>
      <h2 id={`${id}-h`} className="display-cond mt-3 mb-6 text-[clamp(28px,4vw,44px)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Notice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border-[3px] border-dashed border-ink bg-white p-6 sm:p-8">
      <p className="display-cond text-2xl sm:text-3xl">{title}</p>
      {children ? <div className="mt-2 max-w-xl text-lg leading-snug">{children}</div> : null}
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
      <p className="display text-4xl leading-none">{value}</p>
      <p className="label mt-2">{label}</p>
    </div>
  );
}

/**
 * Talaba "Asosiy" sahifasi — o'qish markazi: "Bugun nimani o'rganishim kerak va qayerdan davom etaman?"
 * Xarita va batafsil natijalar "Jarayon" sahifasida.
 */
export async function StudentHome() {
  // Avval rolni tekshiramiz: boshqa rol bo'lsa redirect, API 403 bilan to'qnashmasin
  const user = await requireRole("STUDENT");
  const [overview, mistakes, catalog, next, progress] = await Promise.all([
    apiGet<Overview>("/learning/overview"),
    apiGet<{ groups: MistakeGroup[] }>("/learning/mistakes"),
    apiGet<CatalogDirection[]>("/learning/catalog"),
    apiGet<NextLessons>("/learning/next-lessons"),
    apiGet<ProgressSummary>("/learning/progress"),
  ]);

  const hasDirections = overview.directions.length > 0;
  const autoOpen = !hasDirections && !overview.promptDismissed;
  const pendingDirection = overview.directions.find((d) => d.currentLevelOrd === null);
  const lessonsRow = next.next.filter((l) => l.lessonId !== next.continue?.lessonId);
  const lead = next.continue ?? next.next[0] ?? null;
  const listItems = next.continue ? lessonsRow : next.next.slice(1);

  return (
    <div className="mx-auto max-w-[1180px] space-y-12 px-4 py-8 sm:px-8 sm:py-10">
      <OnboardingHost catalog={catalog} directions={overview.directions} autoOpen={autoOpen} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Asosiy</p>
          <h1 className="display mt-2 text-[clamp(32px,5vw,60px)]">
            Salom, {user.firstName}
            <span className="text-tomato">.</span>
          </h1>
        </div>
        {hasDirections && overview.directions.length < MAX_DIRECTIONS && (
          <OnboardingTrigger request={{ step: "pick" }} className={`${btn} bg-white`}>
            + Yo&apos;nalish qo&apos;shish
          </OnboardingTrigger>
        )}
      </header>

      {/* 4.2 Oxirgi dars / davom ettirish */}
      {!hasDirections ? (
        <div className="border-[3px] border-ink bg-acid p-6 shadow-[8px_8px_0_0_var(--color-ink)] sm:p-8">
          <p className="display-cond text-3xl sm:text-4xl">Nimani o&apos;rganmoqchisiz?</p>
          <p className="mt-2 max-w-xl text-lg leading-snug">
            Fan yoki til tanlang (ko&apos;pi bilan {MAX_DIRECTIONS} ta). Darajangizni aniqlab, shaxsiy yo&apos;l xaritasini tuzamiz.
          </p>
          <OnboardingTrigger request={{ step: "pick" }} className={`${btn} mt-5 bg-ink text-paper`}>
            Yo&apos;nalish tanlash →
          </OnboardingTrigger>
        </div>
      ) : lead ? (
        <ContinueCard item={lead} />
      ) : (
        <Notice title={next.pendingLevel ? "Darajangizni aniqlaymiz" : next.allDone ? "Hozirgi darslar tugatildi" : "Kontent tayyorlanmoqda"}>
          {next.pendingLevel ? (
            <>
              <p>Darslarni ko&apos;rsatish uchun qaysi darajadan boshlashni tanlang.</p>
              {pendingDirection ? (
                <OnboardingTrigger request={{ step: "mode", directionId: pendingDirection.directionId }} className={`${btn} mt-4 bg-acid`}>
                  Darajani tanlash →
                </OnboardingTrigger>
              ) : null}
            </>
          ) : next.allDone ? (
            <p>Ochiq mavzulardagi barcha darslarni tugatdingiz. Yangi darslar qo&apos;shilganda shu yerda ko&apos;rinadi.</p>
          ) : (
            <p>Ochiq mavzular uchun darslar hali nashr qilinmagan. Ular tayyor bo&apos;lgach shu yerda ko&apos;rinadi.</p>
          )}
        </Notice>
      )}

      {/* 4.3 Keyingi darslar */}
      {hasDirections && listItems.length > 0 && (
        <Section id="keyingi" sticker="Keyingi" title="Keyingi darslar">
          <NextLessonList items={listItems} />
        </Section>
      )}

      {/* 4.4 Takrorlash */}
      <Section id="takrorlash" sticker="Xatolar ustida ishlash" title="Qayta takrorlash">
        {hasDirections ? (
          <ReviewPanel groups={mistakes.groups} />
        ) : (
          <Notice title="Avval yo'nalish tanlang">Yo&apos;nalish tanlagach, xatolaringiz shu yerda to&apos;planadi.</Notice>
        )}
      </Section>

      {/* 4.5 Qisqa natijalar */}
      {hasDirections && (
        <Section id="natijalar" sticker="Qisqacha" title="Natijalar">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat value={progress.totals.lessonsCompleted} label="Tugatilgan darslar" />
            <Stat value={progress.activity.activeDays7} label="Oxirgi 7 kunda faol kunlar" />
            <Stat value={progress.activity.streak} label="Ketma-ket faol kunlar" />
          </div>
          <Link href={`${ROUTES.student}/progress`} className={`${btn} mt-6 bg-white`}>
            Batafsil natijalar →
          </Link>
        </Section>
      )}
    </div>
  );
}
