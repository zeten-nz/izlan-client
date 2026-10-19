import { notFound } from "next/navigation";

/** proxy.ts noma'lum /grammar/** yo'llarini shu yerga yo'naltiradi: build vaqtida statik 404 (haqiqiy 404 status). */
export default function GrammarMissing() {
  notFound();
}
