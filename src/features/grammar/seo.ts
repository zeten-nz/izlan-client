import type { Metadata } from "next";

type Page = { title: string; description: string };

/** Grammatika — ichki (login talab qiladigan) bo'lim: barcha sahifalar noindex, sitemap'da yo'q. */
export function grammarMetadata({ title, description }: Page): Metadata {
  return {
    title,
    description,
    robots: { index: false, follow: false },
  };
}
