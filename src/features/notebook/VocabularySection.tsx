"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiGetJson, apiPost, apiSend, type FieldErrors } from "@/lib/api";
import type { FilterOptions, Paged, SortKey, VocabItem } from "./types";
import { usePagedList, useDebounced } from "./usePagedList";
import { ConfirmDelete, EmptyState, Field, LoadMore, LoadState, SourceLine, SourcePicker, SuccessNote, Toolbar, fmtDate, inputCls, primaryBtn, smallBtn } from "./ui";

function VocabForm({
  initial,
  options,
  onSaved,
  onCancel,
}: {
  initial?: VocabItem;
  options: FilterOptions;
  onSaved: (item: VocabItem, created: boolean) => void;
  onCancel: () => void;
}) {
  const [term, setTerm] = useState(initial?.term ?? "");
  const [meaning, setMeaning] = useState(initial?.meaning ?? "");
  const [example, setExample] = useState(initial?.example ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [dir, setDir] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [dups, setDups] = useState<VocabItem[] | null>(null);

  const submit = async (force = false) => {
    setBusy(true);
    setErrors({});
    setFormError("");
    const fields = { term, meaning, example, note };
    type Saved = { entry: VocabItem; created?: boolean };
    const r = initial
      ? await apiSend<Saved>("PATCH", `/notebook/vocabulary/${initial.id}`, fields)
      : await apiPost<Saved>("/notebook/vocabulary", {
          ...fields,
          ...(dir ? { directionId: dir } : {}),
          ...(topic ? { topicId: topic } : {}),
          ...(force ? { force: true } : {}),
        });
    if (r.ok) {
      onSaved(r.data.entry, r.data.created === true);
    } else if (r.status === 409 && !initial) {
      const list = await apiGetJson<Paged<VocabItem>>(`/notebook/vocabulary?q=${encodeURIComponent(term.trim())}&limit=5`);
      setDups(list.ok ? list.data.items.filter((i) => i.term.toLowerCase() === term.trim().toLowerCase()) : []);
      setFormError(r.message);
    } else {
      setErrors("fieldErrors" in r ? r.fieldErrors : {});
      setFormError(r.message);
    }
    setBusy(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(false);
      }}
      className="space-y-4 border-[3px] border-ink bg-paper p-4 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-5"
      aria-label={initial ? "So'zni tahrirlash" : "Yangi so'z"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="So'z yoki atama *" error={errors.term}>
          <input value={term} onChange={(e) => setTerm(e.target.value)} className={inputCls} maxLength={120} autoFocus required />
        </Field>
        <Field label="Tarjima yoki izoh" error={errors.meaning}>
          <input value={meaning} onChange={(e) => setMeaning(e.target.value)} className={inputCls} maxLength={300} placeholder="Masalan: allaqachon" />
        </Field>
      </div>
      <Field label="Misol gap" error={errors.example}>
        <input value={example} onChange={(e) => setExample(e.target.value)} className={inputCls} maxLength={400} />
      </Field>
      <Field label="Qo'shimcha izoh" error={errors.note}>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} rows={2} maxLength={600} />
      </Field>
      {!initial ? <SourcePicker options={options} directionId={dir} topicId={topic} onDirection={setDir} onTopic={setTopic} /> : null}

      {formError && !dups ? (
        <p role="alert" className="border-[3px] border-ink bg-tomato px-3 py-2 font-semibold">
          {formError}
        </p>
      ) : null}
      {dups ? (
        <div role="alert" className="space-y-2 border-[3px] border-ink bg-sky p-3">
          <p className="font-bold">{formError}</p>
          {dups.map((d) => (
            <p key={d.id} className="text-[15px]">
              <strong>{d.term}</strong> — {d.meaning || "ma'nosi yozilmagan"}
            </p>
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void submit(true)} className={primaryBtn}>
              Boshqa ma&apos;noda qo&apos;shish
            </button>
            <button type="button" onClick={onCancel} className={smallBtn}>
              Bekor qilish
            </button>
          </div>
        </div>
      ) : null}

      {!dups ? (
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy || !term.trim()} className={primaryBtn}>
            {busy ? "Saqlanmoqda…" : initial ? "Saqlash" : "Lug'atga qo'shish"}
          </button>
          <button type="button" onClick={onCancel} className={smallBtn}>
            Bekor qilish
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function VocabularySection({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [directionId, setDirectionId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [sort, setSort] = useState<SortKey>("new");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [delError, setDelError] = useState("");
  const dq = useDebounced(q);
  const list = usePagedList<VocabItem>("/notebook/vocabulary", { q: dq.trim() || undefined, directionId: directionId || undefined, topicId: topicId || undefined, sort });
  const filtered = !!(dq.trim() || directionId || topicId);

  const remove = async (id: string) => {
    setBusyId(id);
    setDelError("");
    const r = await apiSend("DELETE", `/notebook/vocabulary/${id}`);
    setBusyId(null);
    if (r.ok) {
      list.remove(id);
      setNotice("So'z lug'atdan o'chirildi");
      router.refresh();
    } else setDelError(r.message);
  };

  return (
    <section aria-label="Lug'at" className="space-y-4">
      <Toolbar
        options={options}
        directionId={directionId}
        topicId={topicId}
        onDirection={setDirectionId}
        onTopic={setTopicId}
        sort={sort}
        onSort={setSort}
        search={{ value: q, onChange: setQ, placeholder: "So'z, ma'no yoki misol bo'yicha qidirish" }}
        extra={
          !adding ? (
            <button type="button" onClick={() => setAdding(true)} className={primaryBtn}>
              + So&apos;z qo&apos;shish
            </button>
          ) : null
        }
      />

      {notice ? <SuccessNote>{notice}</SuccessNote> : null}
      {delError ? (
        <p role="alert" className="border-[3px] border-ink bg-tomato px-3 py-2 font-semibold">
          {delError}
        </p>
      ) : null}

      {adding ? (
        <VocabForm
          options={options}
          onCancel={() => setAdding(false)}
          onSaved={(_, created) => {
            setAdding(false);
            setNotice(created ? "Lug'atga qo'shildi ✓" : "Bu so'z va ma'no lug'atda allaqachon bor");
            void list.reload();
            router.refresh();
          }}
        />
      ) : null}

      <LoadState status={list.status} error={list.error} onRetry={() => void list.reload()} />

      {list.status === "ready" && list.items.length === 0 ? (
        filtered ? (
          <EmptyState title="Hech narsa topilmadi">Qidiruv yoki filtrni o&apos;zgartirib ko&apos;ring.</EmptyState>
        ) : (
          <EmptyState
            title="Lug'at hozircha bo'sh"
            action={
              !adding ? (
                <button type="button" onClick={() => setAdding(true)} className={primaryBtn}>
                  + Birinchi so&apos;zni qo&apos;shish
                </button>
              ) : null
            }
          >
            Dars matnidagi so&apos;z yoki atamani belgilab, darsdan chiqmasdan lug&apos;atga qo&apos;shishingiz mumkin.
          </EmptyState>
        )
      ) : null}

      {list.items.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2" data-testid="vocab-list">
          {list.items.map((it) => (
            <li key={it.id}>
              {editing === it.id ? (
                <VocabForm
                  initial={it}
                  options={options}
                  onCancel={() => setEditing(null)}
                  onSaved={(next) => {
                    list.patch(it.id, next);
                    setEditing(null);
                    setNotice("O'zgarishlar saqlandi ✓");
                  }}
                />
              ) : (
                <article className="h-full border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="display-cond text-2xl leading-tight break-words">{it.term}</h3>
                    <span className="label shrink-0 text-[10px]">{fmtDate(it.createdAt)}</span>
                  </div>
                  {it.meaning ? <p className="mt-1 text-lg font-semibold leading-snug">{it.meaning}</p> : <p className="mt-1 text-ink/50">Ma&apos;nosi yozilmagan</p>}
                  {it.example ? <p className="serif-i mt-2 text-[19px] leading-snug">«{it.example}»</p> : null}
                  {it.note ? <p className="mt-2 whitespace-pre-wrap text-sm text-ink/75">{it.note}</p> : null}
                  <SourceLine source={it.source} />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setEditing(it.id)} className={smallBtn}>
                      Tahrirlash
                    </button>
                    <ConfirmDelete what={it.term} busy={busyId === it.id} onConfirm={() => void remove(it.id)} />
                  </div>
                </article>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {list.status === "ready" && list.items.length > 0 ? (
        <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={() => void list.loadMore()} shown={list.items.length} total={list.total} />
      ) : null}
    </section>
  );
}
