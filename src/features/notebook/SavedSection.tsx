"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiSend } from "@/lib/api";
import type { FilterOptions, SavedItem } from "./types";
import { usePagedList } from "./usePagedList";
import { EmptyState, LoadMore, LoadState, SuccessNote, Toolbar, fmtDate, lessonHref, primaryBtn, smallBtn } from "./ui";

type Kind = "" | "lesson" | "page";

export function SavedSection({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const [directionId, setDirectionId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [kind, setKind] = useState<Kind>("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const list = usePagedList<SavedItem>("/notebook/saved", { directionId: directionId || undefined, topicId: topicId || undefined, kind: kind || undefined });
  const filtered = !!(directionId || topicId || kind);

  const unsave = async (id: string) => {
    setBusyId(id);
    setError("");
    const r = await apiSend("DELETE", `/notebook/saved/${id}`);
    setBusyId(null);
    if (r.ok) {
      list.remove(id);
      setNotice("Saqlanganlardan olib tashlandi");
      router.refresh();
    } else setError(r.message);
  };

  return (
    <section aria-label="Saqlanganlar" className="space-y-4">
      <Toolbar
        options={options}
        directionId={directionId}
        topicId={topicId}
        onDirection={setDirectionId}
        onTopic={setTopicId}
        extra={
          <select aria-label="Tur bo'yicha filtr" value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="border-[3px] border-ink bg-white px-2.5 py-2 text-[15px] font-semibold">
            <option value="">Darslar va sahifalar</option>
            <option value="lesson">Faqat darslar</option>
            <option value="page">Faqat sahifalar</option>
          </select>
        }
      />
      {notice ? <SuccessNote>{notice}</SuccessNote> : null}
      {error ? (
        <p role="alert" className="border-[3px] border-ink bg-tomato px-3 py-2 font-semibold">
          {error}
        </p>
      ) : null}

      <LoadState status={list.status} error={list.error} onRetry={() => void list.reload()} />

      {list.status === "ready" && list.items.length === 0 ? (
        filtered ? (
          <EmptyState title="Hech narsa topilmadi">Filtrni o&apos;zgartirib ko&apos;ring.</EmptyState>
        ) : (
          <EmptyState title="Saqlangan material yo'q">
            Dars ichidagi «Darsni saqlash» yoki «Sahifani saqlash» tugmasi bilan keyin qaytmoqchi bo&apos;lgan materialni shu yerga qo&apos;shing.
          </EmptyState>
        )
      ) : null}

      {list.items.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2" data-testid="saved-list">
          {list.items.map((s) => {
            const open = s.source.state === "ok" && s.source.lessonId;
            return (
              <li key={s.id}>
                <article className="flex h-full flex-col border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="label border-2 border-ink bg-sky px-1.5 py-0.5 text-[10px]">{s.kind === "page" ? "Sahifa" : "Dars"}</span>
                    <span className="label text-[10px]">{fmtDate(s.createdAt)}</span>
                  </div>
                  <h3 className="display-cond mt-2 text-xl leading-tight sm:text-2xl">{s.title}</h3>
                  {s.kind === "page" ? <p className="mt-1 font-semibold">{s.pageTitle || "Nomsiz sahifa"}</p> : null}
                  <p className="mt-1 text-sm text-ink/70">{[s.source.directionTitle, s.source.topicTitle].filter(Boolean).join(" · ")}</p>

                  {s.source.state === "locked" ? <p className="mt-2 font-semibold text-ink/70">Mavzu hali ochilmagan: avval oldingi bosqichlarni tugating.</p> : null}
                  {s.source.state === "missing" || s.source.state === "unpublished" ? (
                    <p className="mt-2 font-semibold text-ink/70">Bu dars endi mavjud emas yoki nashrdan olingan.</p>
                  ) : null}
                  {s.pageMissing ? <p className="mt-2 border-2 border-ink bg-acid px-2 py-1 text-sm font-semibold">Dars yangilangan: bu sahifa endi mavjud emas. Dars ochiladi.</p> : null}

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                    {open ? (
                      <Link href={lessonHref(s.source.lessonId!, s.pageMissing ? null : s.pageId)} className={primaryBtn}>
                        Ochish →
                      </Link>
                    ) : null}
                    <button type="button" disabled={busyId === s.id} onClick={() => void unsave(s.id)} className={smallBtn}>
                      Olib tashlash
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : null}

      {list.status === "ready" && list.items.length > 0 ? (
        <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={() => void list.loadMore()} shown={list.items.length} total={list.total} />
      ) : null}
    </section>
  );
}
