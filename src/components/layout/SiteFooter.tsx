import Link from "next/link";
import { HomeLink } from "@/components/brand/HomeLink";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink, Arrow } from "@/components/ui/Button";
import { Marquee } from "@/components/ui/Marquee";
import { ROUTES, SECTIONS, sectionHref } from "@/config/routes";
import { SITE } from "@/config/site";

const COLUMNS = [
  {
    title: "Platforma",
    links: [
      { label: "Qanday ishlaydi", href: sectionHref(SECTIONS.how) },
      { label: "Imkoniyatlar", href: sectionHref(SECTIONS.features) },
      { label: "Tariflar", href: sectionHref(SECTIONS.pricing) },
      { label: "Savollar", href: sectionHref(SECTIONS.faq) },
    ],
  },
  {
    title: "Hisob",
    links: [
      { label: "Ro‘yxatdan o‘tish", href: ROUTES.register },
      { label: "Kirish", href: ROUTES.login },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t-[3px] border-ink bg-ink text-paper">
      <Marquee
        items={["Izlan", "O‘zing izla", "O‘zing o‘rgan", "Yo‘lni biz ko‘rsatamiz"]}
        className="display border-b-[3px] border-paper/30 bg-acid py-4 text-[clamp(28px,5vw,56px)] text-ink"
      />

      <div className="mx-auto grid max-w-[1480px] gap-12 px-4 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div className="max-w-md">
          <HomeLink aria-label="Izlan, tepaga">
            <Logo tone="light" />
          </HomeLink>
          <p className="mt-6 text-lg text-paper/75">
            Mustaqil o‘rganish platformasi. Bilimingizni aniqlaydi, yo‘l ko‘rsatadi, xatolaringizni tushuntiradi.
          </p>
          <ButtonLink href={ROUTES.register} variant="acid" className="mt-8">
            Bepul boshlash <Arrow />
          </ButtonLink>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="label mb-5 text-acid">{col.title}</h3>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="display-cond text-3xl text-paper/90 decoration-acid decoration-[3px] underline-offset-4 hover:text-acid hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mx-auto flex max-w-[1480px] flex-col gap-3 border-t-[3px] border-paper/20 px-4 py-6 text-sm text-paper/60 md:flex-row md:justify-between md:px-8">
        <p>
          © {SITE.year} Izlan · {SITE.domain}
        </p>
        <p>Mustaqil o‘rganish. O‘zbekistonda yaratilgan.</p>
      </div>
    </footer>
  );
}
