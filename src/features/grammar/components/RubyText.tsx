import type { RubySegment } from "@/lib/grammar/schema";

/**
 * Furigana: strukturali segmentlardan xavfsiz <ruby> elementlari (React matnni o'zi escape qiladi,
 * kontent ichidan xom HTML bajarilmaydi). <rp> — ruby qo'llab-quvvatlamaydigan muhit uchun qavslar.
 */
export function RubyText({ segments, lang }: { segments: RubySegment[]; lang: string }) {
  return (
    <span lang={lang}>
      {segments.map((s, i) =>
        s.reading ? (
          <ruby key={i}>
            {s.base}
            <rp>(</rp>
            <rt>{s.reading}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span key={i}>{s.base}</span>
        ),
      )}
    </span>
  );
}
