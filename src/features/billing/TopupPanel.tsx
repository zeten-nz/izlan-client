"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { apiGetJson, apiPost } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatUzs } from "@/lib/money";
import type { TopupConfig, TopupView } from "./types";

const PRESETS = [10_000, 30_000, 50_000, 100_000] as const;

const btn =
  "inline-flex items-center justify-center gap-2 border-[3px] border-ink px-4 py-2.5 font-display text-[14px] font-black uppercase tracking-tight transition hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-[3px] focus-visible:outline-cobalt";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(value)) {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }
      }}
      aria-label={`${label} — nusxalash`}
      className={cn(btn, "shrink-0 px-3 py-2 text-[12px]", done ? "bg-acid" : "bg-white")}
    >
      {done ? "✓ Nusxalandi" : "Nusxalash"}
    </button>
  );
}

function useCountdown(until: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [until]);
  if (!until) return null;
  const left = Math.max(0, new Date(until).getTime() - now);
  const m = Math.floor(left / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return { left, text: `${m}:${String(s).padStart(2, "0")}` };
}

/**
 * Saytdan to'ldirish: summa tanlanadi → server noyob summa (masalan 50 012) va karta beradi →
 * o'quvchi aynan shu summani o'tkazadi → to'lov kuzatuvchisi bank xabarini o'qiydi → balans o'zi yangilanadi.
 */
export function TopupPanel({
  config,
  initialPending,
  suggestAmount,
  onPaid,
}: {
  config: TopupConfig;
  initialPending: TopupView | null;
  /** Kurs uchun yetmagan summa — tanlovda oldindan belgilanadi */
  suggestAmount?: number;
  onPaid: () => void;
}) {
  const [req, setReq] = useState<TopupView | null>(initialPending);
  const [amount, setAmount] = useState<number>(suggestAmount ?? 50_000);
  const [custom, setCustom] = useState(suggestAmount && !PRESETS.includes(suggestAmount as (typeof PRESETS)[number]) ? String(suggestAmount) : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const timer = useCountdown(req?.status === "PENDING" ? req.expiresAt : null);

  // Kurs uchun yetmagan summa kelsa — tanlovga qo'yiladi (render paytida, effektsiz)
  const [seenSuggest, setSeenSuggest] = useState(suggestAmount);
  if (suggestAmount !== seenSuggest) {
    setSeenSuggest(suggestAmount);
    if (suggestAmount) {
      setAmount(suggestAmount);
      setCustom(PRESETS.includes(suggestAmount as (typeof PRESETS)[number]) ? "" : String(suggestAmount));
    }
  }

  const poll = useCallback(async () => {
    if (!req) return;
    const r = await apiGetJson<TopupView & { balanceUzs: number }>(`/wallet/topups/${req.id}`);
    if (!r.ok) return;
    setReq(r.data);
    if (r.data.status === "PAID") onPaid();
  }, [req, onPaid]);

  // To'lov kutilayotganda: har 5 soniyada va sahifaga qaytilganda tekshiriladi
  useEffect(() => {
    if (req?.status !== "PENDING") return;
    const id = setInterval(poll, 5000);
    const onFocus = () => void poll();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [req?.status, poll]);

  // Taymer tugasa — server javobini kutmasdan "muddat tugadi" ko'rsatiladi (so'rov baribir tekshirilib turadi)
  const status = req?.status === "PENDING" && timer?.left === 0 ? "EXPIRED" : req?.status;

  async function start() {
    setErr("");
    if (!Number.isInteger(amount) || amount < config.min || amount > config.max || amount % config.step !== 0) {
      setErr(`Summa ${formatUzs(config.min)} – ${formatUzs(config.max)} so'm oralig'ida va 1 000 ga karrali bo'lsin.`);
      return;
    }
    setBusy(true);
    const r = await apiPost<TopupView>("/wallet/topups", { amount });
    setBusy(false);
    if (!r.ok) {
      setErr(r.code === "TOPUP_DISABLED" ? "To'ldirish vaqtincha ishlamayapti. Birozdan so'ng urinib ko'ring." : r.message);
      return;
    }
    setReq(r.data);
  }

  async function cancel() {
    if (!req) return;
    setBusy(true);
    await apiPost(`/wallet/topups/${req.id}/cancel`, {});
    setBusy(false);
    setReq(null);
  }

  if (!config.enabled) {
    return (
      <div>
        <p className="label text-ink/60">Balansni to&apos;ldirish</p>
        <p className="mt-3 border-l-[6px] border-tomato pl-3 font-semibold">To&apos;ldirish vaqtincha ishlamayapti. Birozdan so&apos;ng qayta urinib ko&apos;ring.</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {/* ── 1. Summani tanlash ── */}
      {(!req || status === "CANCELLED") && (
        <motion.div key="choose" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          <p className="label text-ink/60">Balansni to&apos;ldirish</p>
          <p className="mt-2 text-ink/75">Summani tanlang — sizga karta va aniq o&apos;tkaziladigan summa beriladi.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setAmount(p);
                  setCustom("");
                  setErr("");
                }}
                aria-pressed={amount === p && !custom}
                className={cn(btn, "py-2 text-[15px]", amount === p && !custom ? "bg-ink text-paper shadow-[3px_3px_0_0_var(--color-acid)]" : "bg-white")}
              >
                {formatUzs(p)}
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center border-[3px] border-ink bg-white focus-within:outline-[3px] focus-within:outline-cobalt">
            <span className="sr-only">Boshqa summa</span>
            <input
              inputMode="numeric"
              placeholder="Boshqa summa"
              value={custom ? formatUzs(Number(custom)) : ""}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 7);
                setCustom(digits);
                setAmount(digits ? Number(digits) : 0);
                setErr("");
              }}
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-lg outline-none"
            />
            <span className="label px-3 text-ink/60">so&apos;m</span>
          </label>
          {err && <p className="mt-3 border-l-[6px] border-tomato pl-3 font-semibold">{err}</p>}
          <button type="button" onClick={start} disabled={busy || !amount} className={cn(btn, "mt-4 w-full bg-acid shadow-[4px_4px_0_0_var(--color-ink)]")}>
            {busy ? "..." : `${amount ? formatUzs(amount) + " so'm" : "Summa"} — davom etish →`}
          </button>
        </motion.div>
      )}

      {/* ── 2. To'lov: noyob summa + karta ── */}
      {req && status === "PENDING" && (
        <motion.div key="pay" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          <div className="flex items-center justify-between gap-3">
            <p className="label text-ink/60">Kartaga o&apos;tkazing</p>
            {timer && (
              <p className={cn("label font-mono", timer.left < 3 * 60_000 ? "text-tomato" : "text-ink/70")} aria-live="off">
                ⏱ {timer.text}
              </p>
            )}
          </div>

          <p className="label mt-4 text-[11px] text-ink/60">1. Aynan shu summa</p>
          <div className="mt-1 flex items-center justify-between gap-3 border-[3px] border-ink bg-acid px-3 py-2 shadow-[4px_4px_0_0_var(--color-ink)]">
            <p className="display text-[clamp(28px,5vw,40px)] leading-none">
              {formatUzs(req.amount)} <span className="label text-sm">so&apos;m</span>
            </p>
            <CopyButton value={String(req.amount)} label="Summa" />
          </div>
          <p className="mt-2 text-[13px] leading-snug text-ink/70">
            Oxirgi raqamlar ({String(req.amount - req.baseAmount).padStart(2, "0")}) — sizning to&apos;lovingizni tanish uchun. Balansga{" "}
            <b>{formatUzs(req.baseAmount)} so&apos;m</b> tushadi.
          </p>

          {req.card && (
            <>
              <p className="label mt-4 text-[11px] text-ink/60">2. Shu kartaga</p>
              <div className="mt-1 flex items-center justify-between gap-3 border-[3px] border-ink bg-white px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-mono text-lg font-bold tracking-wider">{req.card.number}</p>
                  {req.card.holder && <p className="label truncate text-[11px] text-ink/60">{req.card.holder}</p>}
                </div>
                <CopyButton value={req.card.number.replace(/\s/g, "")} label="Karta raqami" />
              </div>
            </>
          )}

          <p className="label mt-4 flex items-center gap-2 text-[11px] text-ink/70">
            <span className="inline-block size-2 animate-pulse bg-ink" aria-hidden />
            To&apos;lov kutilmoqda — pul tushishi bilan balans o&apos;zi yangilanadi
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => void poll()} className={cn(btn, "bg-white text-[12px]")}>
              Tekshirish
            </button>
            <button type="button" onClick={cancel} disabled={busy} className={cn(btn, "bg-paper text-[12px]")}>
              Boshqa summa
            </button>
          </div>
        </motion.div>
      )}

      {/* ── 3. Tushdi ── */}
      {req && status === "PAID" && (
        <motion.div key="paid" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
          <p className="label text-ink/60">To&apos;lov qabul qilindi</p>
          <p className="display mt-3 text-4xl leading-none">✓ +{formatUzs(req.baseAmount)}</p>
          <p className="mt-2 text-ink/75">Balansingizga tushdi. Endi kursni sotib olishingiz mumkin.</p>
          <button type="button" onClick={() => setReq(null)} className={cn(btn, "mt-5 bg-white")}>
            Yana to&apos;ldirish
          </button>
        </motion.div>
      )}

      {/* ── Muddat o'tdi ── */}
      {req && status === "EXPIRED" && (
        <motion.div key="expired" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <p className="label text-ink/60">Muddat tugadi</p>
          <p className="mt-3 font-semibold">{formatUzs(req.amount)} so&apos;m uchun 20 daqiqa o&apos;tdi.</p>
          <p className="mt-2 text-[14px] leading-snug text-ink/70">
            Agar pulni allaqachon o&apos;tkazgan bo&apos;lsangiz — xavotir olmang, 24 soat ichida balansingizga yoziladi. Aks holda yangi summa oling.
          </p>
          <button type="button" onClick={() => setReq(null)} className={cn(btn, "mt-5 bg-acid shadow-[4px_4px_0_0_var(--color-ink)]")}>
            Yangi summa olish
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
