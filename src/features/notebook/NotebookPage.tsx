import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/cn";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";
import { btn } from "@/features/student/components/LessonCards";
import { OnboardingHost } from "@/features/student/components/OnboardingHost";
import { OnboardingTrigger } from "@/features/student/components/OnboardingTrigger";
import { ReviewPanel } from "@/features/student/components/ReviewPanel";
import type { CatalogDirection, MistakeGroup, Overview } from "@/features/student/types";
import { LessonMistakesSection } from "./LessonMistakesSection";
import { NotesSection } from "./NotesSection";
import { SavedSection } from "./SavedSection";
import { VocabularySection } from "./VocabularySection";
import type { FilterOptions, NotebookSummary } from "./types";

export const SECTIONS = [
  { id: "lugat", label: "Lug'at", count: "vocabulary" },
  { id: "eslatma", label: "Eslatmalar", count: "notes" },
  { id: "saqlangan", label: "Saqlanganlar", count: "saved" },
  { id: "xatolar", label: "Xatolarim", count: "mistakes" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
const isSection = (v: string | undefined): v is SectionId => SECTIONS.some((s) => s.id === v);

/** Yo'nalishlar va ularga ochiq mavzular — filtr va mustaqil yozuv manbasi uchun. */
function filterOptions(overview: Overview): FilterOptions {
  const topics: FilterOptions["topics"] = [];
  for (const d of overview.directions) {
    for (const l of d.levels) {
      if (l.state === "locked") continue;
      for (const t of l.topics) if (t.state === "open" || t.state === "current") topics.push({ id: t.id, title: t.title, directionId: d.directionId });
    }
  }
  return { directions: overview.directions.map((d) => ({ id: d.directionId, title: d.title })), topics };
}

/** Daftar: Lug'at · Eslatmalar · Saqlanganlar · Xatolarim. Bo'lim `?bolim=` orqali (havola ulashish va "orqaga" ishlaydi). */
export async function NotebookPage({ section }: { section?: string }) {
  await requireRole("STUDENT");
  const active: SectionId = isSection(section) ? section : "lugat";
  const [overview, summary, catalog] = await Promise.all([
    apiGet<Overview>("/learning/overview"),
    apiGet<NotebookSummary>("/notebook/summary"),
    apiGet<CatalogDirection[]>("/learning/catalog"),
  ]);
  const options = filterOptions(overview);
  const mistakes = active === "xatolar" && overview.directions.length > 0 ? await apiGet<{ groups: MistakeGroup[] }>("/learning/mistakes") : null;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-8 sm:py-10">
      <OnboardingHost catalog={catalog} directions={overview.directions} autoOpen={false} />
      <p className="label">Daftar</p>
      <h1 className="display mt-2 text-[clamp(32px,5vw,60px)]">Mening daftarim</h1>
      <p className="mt-2 max-w-2xl text-lg leading-snug">O&apos;rgangan so&apos;zlaringiz, eslatmalaringiz, saqlagan materiallaringiz va xatolaringiz — bir joyda.</p>

      <nav aria-label="Daftar bo'limlari" className="mt-6 flex flex-wrap gap-2">
        {SECTIONS.map((s) => {
          const on = s.id === active;
          return (
            <Link
              key={s.id}
              href={`${ROUTES.student}/notebook?bolim=${s.id}`}
              aria-current={on ? "page" : undefined}
              data-testid={`tab-${s.id}`}
              className={cn(
                "inline-flex items-center gap-2 border-[3px] border-ink px-4 py-2.5 font-display text-[15px] font-black uppercase tracking-tight focus-visible:outline-[3px] focus-visible:outline-cobalt",
                on ? "bg-ink text-paper shadow-[4px_4px_0_0_var(--color-acid)]" : "bg-white hover:bg-acid",
              )}
            >
              {s.label}
              <span className={cn("border-2 px-1.5 text-[12px]", on ? "border-paper" : "border-ink")}>{summary[s.count]}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        {active === "lugat" ? <VocabularySection options={options} /> : null}
        {active === "eslatma" ? <NotesSection options={options} /> : null}
        {active === "saqlangan" ? <SavedSection options={options} /> : null}
        {active === "xatolar" ? (
          <div className="space-y-10">
            <LessonMistakesSection options={options} />
            <section aria-label="Mashq va test xatolari" className="space-y-4">
              <h2 className="display-cond text-2xl sm:text-3xl">Mashq va test xatolari</h2>
              {mistakes ? (
                <ReviewPanel groups={mistakes.groups} />
              ) : (
                <div className="border-[3px] border-dashed border-ink bg-white p-6 sm:p-8">
                  <p className="display-cond text-2xl">Avval yo&apos;nalish tanlang</p>
                  <OnboardingTrigger request={{ step: "pick" }} className={`${btn} mt-4 bg-acid`}>
                    Yo&apos;nalish tanlash →
                  </OnboardingTrigger>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
