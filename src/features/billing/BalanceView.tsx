"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { apiGetJson, apiPost } from "@/lib/api";
import { Dialog } from "@/components/ui/Dialog";
import { PageContainer, PageHeader } from "@/components/ui/Page";
import { cn } from "@/lib/cn";
import { formatUzs } from "@/lib/money";
import { TopupPanel } from "./TopupPanel";
import type { CourseView, CoursesView, WalletView } from "./types";

const newKey = () => `c-${crypto.randomUUID()}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const btn =
  "inline-flex items-center justify-center gap-2 border-[3px] border-ink px-4 py-2.5 font-display text-[14px] font-black uppercase tracking-tight transition hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-[3px] focus-visible:outline-cobalt";

type Confirm = { course: CourseView; key: string; note?: string };

export function BalanceView({ wallet: initialWallet, courses: initialCourses, buyId }: { wallet: WalletView; courses: CoursesView; buyId?: string }) {
  const [wallet, setWallet] = useState(initialWallet);
  const [courses, setCourses] = useState(initialCourses.courses);
  const [suggest, setSuggest] = useState<number | undefined>(undefined);
  const topupRef = useRef<HTMLDivElement | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const highlightRef = useRef<HTMLLIElement | null>(null);

  const balance = wallet.balanceUzs;

  async function refresh() {
    const [w, c] = await Promise.all([apiGetJson<WalletView>("/wallet"), apiGetJson<CoursesView>("/courses")]);
    if (w.ok) setWallet(w.data);
    if (c.ok) setCourses(c.data.courses);
    return w.ok ? w.data : null;
  }

  useEffect(() => {
    if (buyId && highlightRef.current) highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [buyId]);

  async function doBuy() {
    if (!confirm) return;
    const { course, key } = confirm;
    setBusy(true);
    setErr("");
    const r = await apiPost<{ replay: boolean; balanceUzs: number; endsAt: string }>(`/courses/${course.id}/buy`, {
      idempotencyKey: key,
      expectedPrice: course.monthlyPriceUzs ?? undefined,
    });
    setBusy(false);
    if (r.ok) {
      setConfirm(null);
      setNotice(`«${course.title}» ${fmtDate(r.data.endsAt)} gacha ochildi.`);
      await refresh();
      return;
    }
    if (r.code === "PRICE_CHANGED") {
      const c = await apiGetJson<CoursesView>("/courses");
      const upd = c.ok ? c.data.courses.find((x) => x.id === course.id) : undefined;
      if (c.ok) setCourses(c.data.courses);
      if (upd) {
        setConfirm({ course: upd, key: newKey(), note: `Narx o'zgargan: endi ${formatUzs(upd.monthlyPriceUzs ?? 0)} so'm. Qayta tasdiqlang.` });
        return;
      }
    }
    setErr(r.code === "INSUFFICIENT_FUNDS" ? "Balansda mablag' yetarli emas — avval balansni to'ldiring." : r.message);
  }

  const shortBy = confirm ? Math.max(0, (confirm.course.monthlyPriceUzs ?? 0) - balance) : 0;
  const paid = courses.filter((c) => c.monthlyPriceUzs !== null);
  const free = courses.filter((c) => c.monthlyPriceUzs === null);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Hisob"
        title="Balans"
        aside={<p className="max-w-md text-ink/75">Balansni kartadan to&apos;ldiring, kurslarni shu yerda bir bosishda oling. Har xarid — 30 kun.</p>}
      />

      {/* ── Balans kartasi ── */}
      <section className="relative mt-8 grid gap-0 border-[3px] border-ink bg-white shadow-[8px_8px_0_0_var(--color-ink)] md:grid-cols-[1.2fr_1fr]">
        <div className="relative overflow-hidden border-b-[3px] border-ink bg-acid p-6 md:border-b-0 md:border-r-[3px] sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{ backgroundImage: "radial-gradient(var(--color-ink) 1.2px, transparent 1.2px)", backgroundSize: "14px 14px" }}
          />
          <p className="label relative">Mavjud mablag&apos;</p>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={balance}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="display relative mt-2 flex flex-wrap items-baseline gap-x-3 text-[clamp(48px,8vw,96px)] leading-none"
            >
              {formatUzs(balance)}
              <span className="label text-base">so&apos;m</span>
            </motion.p>
          </AnimatePresence>
          {wallet.access.some((a) => a.active) && (
            <ul className="relative mt-6 flex flex-wrap gap-2">
              {wallet.access
                .filter((a) => a.active)
                .map((a) => (
                  <li key={a.directionId} className="label border-[3px] border-ink bg-white px-2.5 py-1 text-[11px]">
                    {a.directionTitle} · {fmtDate(a.endsAt)} gacha
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div ref={topupRef} className="scroll-mt-24 p-6 sm:p-8">
          <TopupPanel config={wallet.topup} initialPending={wallet.topup.pending} suggestAmount={suggest} onPaid={() => void refresh()} />
        </div>
      </section>

      {notice && (
        <p role="status" className="mt-6 border-[3px] border-ink bg-acid px-4 py-3 font-semibold shadow-[4px_4px_0_0_var(--color-ink)]">
          ✓ {notice}
        </p>
      )}

      {/* ── Kurslar ── */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="display-cond text-4xl">Kurslar</h2>
          <p className="label text-ink/60">Har darajaning 1-mavzusi bepul</p>
        </div>
        {paid.length === 0 && free.length === 0 && <p className="mt-6 text-ink/70">Hozircha kurslar yo&apos;q.</p>}
        <ul className="mt-6 grid gap-5 md:grid-cols-2">
          {[...paid, ...free].map((c) => {
            const isFree = c.monthlyPriceUzs === null;
            const highlight = buyId === c.id;
            const enough = !isFree && balance >= (c.monthlyPriceUzs ?? 0);
            return (
              <li
                key={c.id}
                ref={highlight ? highlightRef : undefined}
                className={cn(
                  "flex flex-col border-[3px] border-ink bg-white p-5 sm:p-6",
                  highlight ? "shadow-[8px_8px_0_0_var(--color-tomato)] outline outline-[3px] outline-offset-4 outline-tomato" : "shadow-[6px_6px_0_0_var(--color-ink)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="label text-ink/60">{c.levels.length ? `${c.levels[0]}–${c.levels[c.levels.length - 1]}` : c.kind === "LANGUAGE" ? "Til" : "Fan"}</p>
                    <h3 className="display-cond text-3xl leading-tight">{c.title}</h3>
                  </div>
                  {c.active && <span className="label shrink-0 border-[3px] border-ink bg-acid px-2 py-1 text-[11px]">Faol</span>}
                </div>
                <p className="mt-2 text-[15px] text-ink/75">{c.description}</p>
                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
                  <p className="flex items-baseline gap-1.5">
                    <span className="display text-3xl leading-none">{isFree ? "Bepul" : formatUzs(c.monthlyPriceUzs!)}</span>
                    {!isFree && <span className="label text-[11px]">so&apos;m / {c.accessDays} kun</span>}
                  </p>
                  {!isFree && (
                    <button
                      type="button"
                      onClick={() => {
                        setErr("");
                        setNotice("");
                        setConfirm({ course: c, key: newKey() });
                      }}
                      className={cn(btn, enough ? "bg-ink text-paper shadow-[4px_4px_0_0_var(--color-acid)]" : "bg-paper")}
                    >
                      {c.active ? "Uzaytirish" : "Sotib olish"}
                    </button>
                  )}
                </div>
                {c.endsAt && (
                  <p className={cn("label mt-3 text-[11px]", c.active ? "text-ink/70" : "text-tomato")}>
                    {c.active ? `${fmtDate(c.endsAt)} gacha ochiq` : `Muddat tugagan: ${fmtDate(c.endsAt)}`}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Tarix ── */}
      <section className="mt-14">
        <h2 className="display-cond text-4xl">Tarix</h2>
        {wallet.history.length === 0 ? (
          <p className="mt-4 border-[3px] border-dashed border-ink/40 p-5 text-ink/60">Hali amallar yo&apos;q.</p>
        ) : (
          <ul className="mt-4 divide-y-[3px] divide-ink border-[3px] border-ink bg-white">
            {wallet.history.map((h) => (
              <li key={h.id} className="flex items-center gap-4 px-4 py-3">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center border-[3px] border-ink font-black",
                    h.amount > 0 ? "bg-acid" : "bg-paper-2",
                  )}
                  aria-hidden
                >
                  {h.amount > 0 ? "+" : "−"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {h.kind === "TOPUP" ? "To'ldirish" : h.kind === "PURCHASE" ? `Kurs: ${h.directionTitle ?? ""}` : "Tuzatish"}
                  </p>
                  <p className="label text-[11px] text-ink/60">{fmtDateTime(h.createdAt)}</p>
                </div>
                <p className={cn("font-mono text-lg font-bold", h.amount > 0 ? "text-ink" : "text-ink/70")}>
                  {h.amount > 0 ? "+" : "−"}
                  {formatUzs(Math.abs(h.amount))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Tasdiqlash oynasi ── */}
      {/* Native <dialog>: Escape, fokusni ushlab turish va qaytarish brauzer tomonidan (UI-10) */}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} labelledBy="buy-title" busy={busy}>
        {confirm && (
          <>
              <p className="label text-ink/60">Tasdiqlash</p>
              <h3 id="buy-title" className="display-cond mt-1 text-3xl">
                {confirm.course.title}
              </h3>
              <p className="mt-3">
                <b>{formatUzs(confirm.course.monthlyPriceUzs ?? 0)} so&apos;m</b> balansdan yechiladi, kurs{" "}
                <b>{confirm.course.accessDays} kunga</b> {confirm.course.active ? "uzaytiriladi" : "ochiladi"}.
              </p>
              {shortBy > 0 ? (
                <p className="mt-3 border-l-[6px] border-tomato pl-3 font-semibold">
                  Balansda {formatUzs(balance)} so&apos;m bor — yana <b>{formatUzs(shortBy)} so&apos;m</b> kerak.
                </p>
              ) : (
                <p className="label mt-2 text-ink/60">Balansdan keyin: {formatUzs(balance - (confirm.course.monthlyPriceUzs ?? 0))} so&apos;m</p>
              )}
              {confirm.note && <p className="mt-3 border-l-[6px] border-tomato pl-3 font-semibold">{confirm.note}</p>}
              {err && <p className="mt-3 border-l-[6px] border-tomato pl-3 font-semibold">{err}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                {shortBy > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSuggest(Math.max(wallet.topup.min, Math.ceil(shortBy / wallet.topup.step) * wallet.topup.step));
                      setConfirm(null);
                      setTimeout(() => topupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                    }}
                    className={cn(btn, "bg-acid shadow-[4px_4px_0_0_var(--color-ink)]")}
                  >
                    Balansni to&apos;ldirish →
                  </button>
                ) : (
                  <button type="button" onClick={doBuy} disabled={busy} className={cn(btn, "bg-acid shadow-[4px_4px_0_0_var(--color-ink)]")}>
                    {busy ? "..." : "Tasdiqlash"}
                  </button>
                )}
                <button type="button" onClick={() => setConfirm(null)} disabled={busy} className={cn(btn, "bg-white")}>
                  Bekor qilish
                </button>
              </div>
          </>
        )}
      </Dialog>
    </PageContainer>
  );
}
