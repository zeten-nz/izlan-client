import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ROUTES, grammarHref } from "@/config/routes";
import { Sticker } from "@/components/ui/Sticker";
import { BackToLesson } from "./BackToLesson";

/**
 * Grammatika 404. `standalone`: proxy yuborgan statik 404 (qobiqsiz): marketing header chiqmaydi,
 * o'rniga oddiy logo va qaytish havolalari. Qobiq ichida (standalone=false) layout o'zi header beradi.
 */
export function GrammarNotFound({ standalone = false }: { standalone?: boolean }) {
  const body = (
    <section className="mx-auto max-w-[900px] px-4 py-16 md:px-8 md:py-24">
      <Sticker tone="tomato" rotate={-3}>Xato 404</Sticker>
      <h1 className="display-cond mt-6 text-[clamp(36px,6vw,72px)]">Qoida topilmadi</h1>
      <p className="mt-4 max-w-lg text-xl leading-snug">
        Qoida hozircha mavjud emas yoki havola eskirgan. Darsga yoki grammatika bo‘limiga qayting.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={grammarHref()}
          className="label inline-flex min-h-11 items-center border-[3px] border-ink bg-acid px-4 py-2 shadow-[4px_4px_0_0_var(--color-ink)]"
        >
          Grammatika
        </Link>
        {standalone && <BackToLesson />}
        {standalone && (
          <Link href={ROUTES.student} className="label inline-flex min-h-11 items-center border-[3px] border-ink bg-white px-4 py-2">
            Bosh sahifa
          </Link>
        )}
      </div>
    </section>
  );
  if (!standalone) return body;
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b-[3px] border-ink">
        <div className="mx-auto flex max-w-[1480px] items-center px-4 py-3 md:px-8">
          <Link href={ROUTES.student} aria-label="Izlan">
            <Logo />
          </Link>
        </div>
      </header>
      {body}
    </div>
  );
}
