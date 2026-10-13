"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost, apiSend, type FieldErrors } from "@/lib/api";
import type { FilterOptions, NoteItem, SortKey } from "./types";
import { usePagedList, useDebounced } from "./usePagedList";
import { ConfirmDelete, EmptyState, Field, LoadMore, LoadState, SourceLine, SourcePicker, SuccessNote, Toolbar, fmtDate, inputCls, primaryBtn, smallBtn } from "./ui";

function NoteForm({
  initial,
  options,
  onSaved,
  onCancel,
}: {
  initial?: NoteItem;
  options: FilterOptions;
  onSaved: (note: NoteItem) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [dir, setDir] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  const submit = async () => {
    setBusy(true);
    setErrors({});
    setFormError("");
    const r = initial
      ? await apiSend<{ note: NoteItem }>("PATCH", `/notebook/notes/${initial.id}`, { title, body })
      : await apiPost<{ note: NoteItem }>("/notebook/notes", { title, body, ...(dir ? { directionId: dir } : {}), ...(topic ? { topicId: topic } : {}) });
    setBusy(false);
    if (r.ok) onSaved(r.data.note);
    else {
      setErrors(r.fieldErrors);
      setFormError(r.message);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-4 border-[3px] border-ink bg-paper p-4 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-5"
      aria-label={initial ? "Eslatmani tahrirlash" : "Yangi eslatma"}
    >
      <Field label="Sarlavha (ixtiyoriy)" error={errors.title}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} maxLength={120} />
      </Field>
      <Field label="Matn *" error={errors.body}>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} className={inputCls} rows={6} maxLength={5000} autoFocus required />
      </Field>
      {!initial ? <SourcePicker options={options} directionId={dir} topicId={topic} onDirection={setDir} onTopic={setTopic} /> : null}
      {formError && Object.keys(errors).length === 0 ? (
        <p role="alert" className="border-[3px] border-ink bg-tomato px-3 py-2 font-semibold">
          {formError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy || !body.trim()} className={primaryBtn}>
          {busy ? "Saqlanmoqda…" : "Saqlash"}
        </button>
        <button type="button" onClick={onCancel} className={smallBtn}>
          Bekor qilish
        </button>
      </div>
    </form>
  );
}

export function NotesSection({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [directionId, setDirectionId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [sort, setSort] = useState<SortKey>("new");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [delError, setDelError] = useState("");
  const dq = useDebounced(q);
  const list = usePagedList<NoteItem>("/notebook/notes", { q: dq.trim() || undefined, directionId: directionId || undefined, topicId: topicId || undefined, sort });
  const filtered = !!(dq.trim() || directionId || topicId);

  const remove = async (id: string) => {
    setBusyId(id);
    setDelError("");
    const r = await apiSend("DELETE", `/notebook/notes/${id}`);
    setBusyId(null);
    if (r.ok) {
      list.remove(id);
      setNotice("Eslatma o'chirildi");
      router.refresh();
    } else setDelError(r.message);
  };

  return (
    <section aria-label="Eslatmalar" className="space-y-4">
      <Toolbar
        options={options}
        directionId={directionId}
        topicId={topicId}
        onDirection={setDirectionId}
        onTopic={setTopicId}
        sort={sort}
        onSort={setSort}
        search={{ value: q, onChange: setQ, placeholder: "Sarlavha yoki matn bo'yicha qidirish" }}
        extra={
          !adding ? (
            <button type="button" onClick={() => setAdding(true)} className={primaryBtn}>
              + Eslatma yozish
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
        <NoteForm
          options={options}
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            setNotice("Eslatma saqlandi ✓");
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
            title="Eslatmalar hozircha yo'q"
            action={
              !adding ? (
                <button type="button" onClick={() => setAdding(true)} className={primaryBtn}>
                  + Birinchi eslatmani yozish
                </button>
              ) : null
            }
          >
            O&apos;zingiz tushungan qoidalar va fikrlarni shu yerda yozib boring. Dars ichida ham «Eslatma» tugmasi bor.
          </EmptyState>
        )
      ) : null}

      {list.items.length > 0 ? (
        <ul className="space-y-4" data-testid="note-list">
          {list.items.map((n) => (
            <li key={n.id}>
              {editing === n.id ? (
                <NoteForm
                  initial={n}
                  options={options}
                  onCancel={() => setEditing(null)}
                  onSaved={(next) => {
                    list.patch(n.id, next);
                    setEditing(null);
                    setNotice("O'zgarishlar saqlandi ✓");
                  }}
                />
              ) : (
                <article className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)] sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="display-cond text-xl leading-tight sm:text-2xl">{n.title || n.body.split("\n")[0].slice(0, 60)}</h3>
                    <span className="label shrink-0 text-[10px]">
                      {n.updatedAt !== n.createdAt ? `Yangilangan ${fmtDate(n.updatedAt)}` : fmtDate(n.createdAt)}
                    </span>
                  </div>
                  <p className={`mt-2 whitespace-pre-wrap text-[17px] leading-snug ${open === n.id ? "" : "line-clamp-4"}`}>{n.body}</p>
                  {n.body.length > 220 || n.body.split("\n").length > 4 ? (
                    <button type="button" onClick={() => setOpen(open === n.id ? null : n.id)} className="mt-1 text-sm font-bold underline" aria-expanded={open === n.id}>
                      {open === n.id ? "Yig'ish" : "To'liq o'qish"}
                    </button>
                  ) : null}
                  <SourceLine source={n.source} />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setEditing(n.id)} className={smallBtn}>
                      Tahrirlash
                    </button>
                    <ConfirmDelete what="Eslatma" busy={busyId === n.id} onConfirm={() => void remove(n.id)} />
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
