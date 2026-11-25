"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGetJson, apiPost } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatUzs } from "@/lib/money";
import { Field, LoadState, inputCls, primaryBtn, smallBtn } from "@/features/notebook/ui";

type IncomeStatus = "MATCHED" | "LATE_MATCHED" | "REVIEW" | "ASSIGNED" | "IGNORED";

type Overview = {
  pending: Array<{ id: string; username: string; amount: number; baseAmount: number; createdAt: string; expiresAt: string }>;
  recent: Array<{
    id: string;
    source: string;
    amount: number;
    receivedAt: string;
    status: IncomeStatus;
    reasonText: string | null;
    creditedAmount: number | null;
    username: string | null;
  }>;
};

type ReviewItem = {
  id: string;
  amount: number;
  receivedAt: string;
  reasonText: string | null;
  suggestedCredit: number;
  similar: Array<{ username: string; amount: number; status: string; createdAt: string }>;
};

type Report = {
  month: string;
  credited: { count: number; sum: number; creditedSum: number };
  review: { count: number; sum: number };
  ignored: { count: number; sum: number };
  days: Array<{ day: string; count: number; sum: number }>;
};

type RecordResult =
  | { result: "MATCH" | "LATE_MATCH"; incomeId: string; credited: number; username: string; balanceUzs: number }
  | { result: "REVIEW"; incomeId: string; reason: string; reasonText: string }
  | { result: "DUPLICATE"; incomeId: string };

const STATUS_LABEL: Record<IncomeStatus, string> = {
  MATCHED: "Yozildi",
  LATE_MATCHED: "Kechikib yozildi",
  ASSIGNED: "Qo'lda yozildi",
  REVIEW: "Ko'rib chiqish",
  IGNORED: "Tegishli emas",
};
const STATUS_BG: Record<IncomeStatus, string> = {
  MATCHED: "bg-acid",
  LATE_MATCHED: "bg-acid",
  ASSIGNED: "bg-acid",
  REVIEW: "bg-tomato",
  IGNORED: "bg-paper",
};

/** 25.11 14:07 — mahalliy vaqtda, kun.oy (locale farqi bo'lmasin). */
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** "50 037", "50.037,00 UZS", "50037" → 50037. Tiyin (",00") tashlanadi; boshqa kasr — null. */
export function parseSom(input: string): number | null {
  let s = input.trim().replace(/\s*(uzs|so['ʻ’`]?m|сум)\s*$/i, "");
  const frac = /[.,](\d{1,2})$/.exec(s);
  if (frac) {
    if (Number(frac[1]) !== 0) return null;
    s = s.slice(0, -frac[0].length);
  }
  const digits = s.replace(/[\s.,]/g, "");
  if (!/^\d{1,10}$/.test(digits)) return null;
  const n = Number(digits);
  return n > 0 ? n : null;
}

/** datetime-local qiymati uchun hozirgi mahalliy vaqt. */
function nowLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** Har 30 soniyada yangilanadigan "hozir" (render ichida Date.now() chaqirilmaydi). */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Box({ title, hint, children, className }: { title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("border-[3px] border-ink bg-white p-4 shadow-[5px_5px_0_0_var(--color-ink)] sm:p-6", className)}>
      <h2 className="display-cond text-2xl sm:text-3xl">{title}</h2>
      {hint ? <p className="mt-1 max-w-2xl text-ink/70">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// ───────────── Kirim kiritish ─────────────

function RecordForm({ prefill, onDone }: { prefill: number | null; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [time, setTime] = useState(nowLocal);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<RecordResult | null>(null);
  const [seenPrefill, setSeenPrefill] = useState<number | null>(null);

  if (prefill !== seenPrefill) {
    setSeenPrefill(prefill);
    if (prefill) {
      setAmount(formatUzs(prefill));
      setResult(null);
      setErr("");
    }
  }

  const submit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const n = parseSom(amount);
    if (!n) return setErr("Summani bank xabaridagidek butun so'mda kiriting, masalan 50 037.");
    const at = time ? new Date(time) : new Date();
    if (Number.isNaN(at.getTime())) return setErr("Vaqt noto'g'ri");
    setBusy(true);
    setErr("");
    const r = await apiPost<RecordResult>("/admin/incomes", { amount: n, receivedAt: at.toISOString(), requestId });
    setBusy(false);
    if (!r.ok) {
      // Tarmoq xatosida o'sha requestId saqlanadi — qayta bosilsa ikki marta yozilmaydi
      return setErr(r.message);
    }
    setResult(r.data);
    setRequestId(crypto.randomUUID());
    setAmount("");
    setTime(nowLocal());
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <Field label="Kartaga tushgan summa" hint="Bank xabaridagi aniq summa, oxirgi raqamlari bilan (masalan 50 037).">
          <input
            className={cn(inputCls, "font-display text-2xl font-black")}
            inputMode="numeric"
            autoComplete="off"
            placeholder="50 037"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-describedby="income-help"
          />
        </Field>
        <Field label="Pul tushgan vaqt" hint="Bank xabaridagi vaqt.">
          <input type="datetime-local" className={inputCls} value={time} max={nowLocal()} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <p id="income-help" className="text-sm text-ink/70">
        Summa kutilayotgan to&apos;lovga mos kelsa — o&apos;quvchi balansi darhol to&apos;ldiriladi. Mos kelmasa — pastdagi
        «Ko&apos;rib chiqish» ro&apos;yxatiga tushadi. Bir pulni ikki marta kiritsangiz ham, balansga ikki marta yozilmaydi.
      </p>
      {err ? (
        <p role="alert" className="border-[3px] border-ink bg-tomato p-3 font-semibold">
          {err}
        </p>
      ) : null}
      {result ? <ResultNote r={result} /> : null}
      <button type="submit" className={primaryBtn} disabled={busy || !amount.trim()}>
        {busy ? "Yozilmoqda…" : "Kirimni kiritish"}
      </button>
    </form>
  );
}

function ResultNote({ r }: { r: RecordResult }) {
  if (r.result === "MATCH" || r.result === "LATE_MATCH") {
    return (
      <p role="status" className="border-[3px] border-ink bg-acid p-3 font-semibold">
        ✓ @{r.username} balansiga +{formatUzs(r.credited)} so&apos;m yozildi{r.result === "LATE_MATCH" ? " (kechikkan to'lov)" : ""}. Yangi
        balans: {formatUzs(r.balanceUzs)} so&apos;m.
      </p>
    );
  }
  if (r.result === "DUPLICATE")
    return (
      <p role="status" className="border-[3px] border-ink bg-paper p-3 font-semibold">
        Bu kirim allaqachon yozilgan — hech narsa o&apos;zgarmadi.
      </p>
    );
  if (r.result !== "REVIEW") return null;
  return (
    <p role="status" className="border-[3px] border-ink bg-tomato/80 p-3 font-semibold">
      Avtomatik mos kelmadi: {r.reasonText}. Pastdagi «Ko&apos;rib chiqish» ro&apos;yxatidan kimga tegishli ekanini tanlang.
    </p>
  );
}

// ───────────── Kutilayotgan to'lovlar ─────────────

function PendingList({ items, onPick }: { items: Overview["pending"]; onPick: (amount: number) => void }) {
  const now = useNow();
  if (!items.length) return <p className="text-ink/70">Hozir hech kim to&apos;lov kutmayapti.</p>;
  return (
    <ul className="divide-y-[3px] divide-ink border-[3px] border-ink">
      {items.map((p) => {
        const left = Math.max(0, Math.ceil((new Date(p.expiresAt).getTime() - Math.max(now, new Date(p.createdAt).getTime())) / 60_000));
        return (
          <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
            <span className="font-display text-xl font-black tabular-nums">{formatUzs(p.amount)} so&apos;m</span>
            <span className="font-semibold">@{p.username}</span>
            <span className="label text-ink/60">{left} daq. qoldi</span>
            <button type="button" className={cn(smallBtn, "ml-auto")} onClick={() => onPick(p.amount)}>
              Pul tushdi →
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ───────────── Ko'rib chiqish ─────────────

function ReviewCard({ item, onChanged }: { item: ReviewItem; onChanged: () => void }) {
  const [username, setUsername] = useState("");
  const [credit, setCredit] = useState(formatUzs(item.suggestedCredit));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [askIgnore, setAskIgnore] = useState(false);

  const assign = async () => {
    const n = parseSom(credit);
    if (!username.trim()) return setErr("Foydalanuvchi nomini kiriting");
    if (!n) return setErr("Balansga yoziladigan summa noto'g'ri");
    setBusy(true);
    setErr("");
    const r = await apiPost(`/admin/incomes/${item.id}/assign`, { username: username.trim().replace(/^@/, ""), amount: n });
    setBusy(false);
    if (!r.ok) return setErr(r.status === 404 ? "Bunday foydalanuvchi topilmadi" : r.message);
    onChanged();
  };

  const ignore = async () => {
    setBusy(true);
    setErr("");
    const r = await apiPost(`/admin/incomes/${item.id}/ignore`, { note: "admin: Izlan'ga tegishli emas" });
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    onChanged();
  };

  return (
    <li className="border-[3px] border-ink bg-white p-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-display text-2xl font-black tabular-nums">{formatUzs(item.amount)} so&apos;m</span>
        <span className="label text-ink/60">{fmtTime(item.receivedAt)}</span>
      </div>
      <p className="mt-1 font-semibold">{item.reasonText ?? "Sabab ko'rsatilmagan"}</p>
      {item.similar.length ? (
        <div className="mt-3">
          <p className="label">O&apos;xshash so&apos;rovlar — bosib tanlang</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.similar.map((s, i) => (
              <button key={`${s.username}-${i}`} type="button" className={smallBtn} onClick={() => setUsername(s.username)}>
                @{s.username} · {formatUzs(s.amount)} · {s.status === "PAID" ? "to'langan" : s.status === "PENDING" ? "kutmoqda" : "yopilgan"}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
        <Field label="Kimga (username)">
          <input className={inputCls} value={username} placeholder="ali_valiyev" autoComplete="off" onChange={(e) => setUsername(e.target.value)} />
        </Field>
        <Field label="Balansga yoziladi">
          <input className={inputCls} inputMode="numeric" value={credit} onChange={(e) => setCredit(e.target.value)} />
        </Field>
        <button type="button" className={primaryBtn} disabled={busy} onClick={assign}>
          Yozish
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {askIgnore ? (
          <>
            <span className="font-semibold">Izlan&apos;ga tegishli emasmi (shaxsiy o&apos;tkazma)?</span>
            <button type="button" className={cn(smallBtn, "hover:bg-tomato")} disabled={busy} onClick={ignore}>
              Ha, tegishli emas
            </button>
            <button type="button" className={smallBtn} onClick={() => setAskIgnore(false)}>
              Yo&apos;q
            </button>
          </>
        ) : (
          <button type="button" className={smallBtn} onClick={() => setAskIgnore(true)}>
            Izlan&apos;ga tegishli emas
          </button>
        )}
      </div>
      {err ? (
        <p role="alert" className="mt-3 border-[3px] border-ink bg-tomato p-2 font-semibold">
          {err}
        </p>
      ) : null}
    </li>
  );
}

// ───────────── Oylik hisobot ─────────────

function thisMonth() {
  // Toshkent (UTC+5) bo'yicha joriy oy
  return new Date(Date.now() + 5 * 3_600_000).toISOString().slice(0, 7);
}

function ReportBox() {
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState<Report | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async (m: string) => {
    const r = await apiGetJson<Report>(`/admin/incomes/report?month=${encodeURIComponent(m)}`);
    if (!r.ok) {
      setError(r.message);
      setStatus("error");
      return;
    }
    setData(r.data);
    setStatus("ready");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(month), 0);
    return () => clearTimeout(t);
  }, [load, month]);

  return (
    <Box title="Oylik savdo" hint="Soliq uchun qo'lda hisobga olish: kartaga tushgan va o'quvchilar balansiga yozilgan pullar (Toshkent vaqti).">
      <div className="max-w-[220px]">
        <Field label="Oy">
          <input type="month" className={inputCls} value={month} max={thisMonth()} onChange={(e) => {
              if (!e.target.value) return;
              setStatus("loading");
              setMonth(e.target.value);
            }} />
        </Field>
      </div>
      <div className="mt-4">
        <LoadState
          status={status}
          error={error}
          onRetry={() => {
            setStatus("loading");
            void load(month);
          }}
        />
        {status === "ready" && data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border-[3px] border-ink bg-acid p-4">
                <p className="label">Izlan savdosi</p>
                <p className="mt-1 font-display text-3xl font-black tabular-nums">{formatUzs(data.credited.sum)}</p>
                <p className="text-sm">so&apos;m · {data.credited.count} ta to&apos;lov</p>
              </div>
              <div className="border-[3px] border-ink bg-white p-4">
                <p className="label">Hal qilinmagan</p>
                <p className="mt-1 font-display text-3xl font-black tabular-nums">{formatUzs(data.review.sum)}</p>
                <p className="text-sm">so&apos;m · {data.review.count} ta</p>
              </div>
              <div className="border-[3px] border-ink bg-paper p-4">
                <p className="label">Tegishli emas</p>
                <p className="mt-1 font-display text-3xl font-black tabular-nums">{formatUzs(data.ignored.sum)}</p>
                <p className="text-sm">so&apos;m · {data.ignored.count} ta</p>
              </div>
            </div>
            {data.credited.sum !== data.credited.creditedSum ? (
              <p className="mt-2 text-sm text-ink/70">
                Balanslarga yozilgani: {formatUzs(data.credited.creditedSum)} so&apos;m (farq — noyob summaning oxirgi raqamlari).
              </p>
            ) : null}
            {data.days.length ? (
              <table className="mt-4 w-full border-[3px] border-ink text-left">
                <thead className="bg-ink text-paper">
                  <tr>
                    <th className="label px-3 py-2">Kun</th>
                    <th className="label px-3 py-2 text-right">To&apos;lovlar</th>
                    <th className="label px-3 py-2 text-right">Summa, so&apos;m</th>
                  </tr>
                </thead>
                <tbody>
                  {data.days.map((d) => (
                    <tr key={d.day} className="border-t-[3px] border-ink">
                      <td className="px-3 py-2 font-semibold">{d.day.split("-").reverse().join(".")}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{d.count}</td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums">{formatUzs(d.sum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-4 text-ink/70">Bu oyda savdo yo&apos;q.</p>
            )}
          </>
        ) : null}
      </div>
    </Box>
  );
}

// ───────────── Sahifa ─────────────

export function IncomesManager() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [prefill, setPrefill] = useState<number | null>(null);
  const [reportKey, setReportKey] = useState(0);

  const load = useCallback(async (quiet = false) => {
    const [o, r] = await Promise.all([apiGetJson<Overview>("/admin/incomes"), apiGetJson<ReviewItem[]>("/admin/incomes/review")]);
    if (!o.ok || !r.ok) {
      if (!quiet) {
        setError((!o.ok && o.message) || (!r.ok && r.message) || "");
        setStatus("error");
      }
      return;
    }
    setOverview(o.data);
    setReview(r.data);
    setStatus("ready");
  }, []);

  useEffect(() => {
    // Birinchi yuklash ham taymer orqali (effect ichida sinxron setState yo'q)
    const first = setTimeout(() => void load(), 0);
    const id = setInterval(() => void load(true), 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  const changed = () => {
    void load(true);
    setReportKey((k) => k + 1);
  };

  return (
    <div className="space-y-8">
      <Box title="Kirim kiritish" hint="Kartaga pul tushgani haqida bank xabari kelganda summani shu yerga kiriting.">
        <RecordForm
          prefill={prefill}
          onDone={() => {
            setPrefill(null);
            changed();
          }}
        />
      </Box>

      <LoadState
        status={status}
        error={error}
        onRetry={() => {
          setStatus("loading");
          void load();
        }}
      />

      {overview ? (
        <Box title="To'lov kutayotganlar" hint="Saytda summa olgan, lekin puli hali yozilmagan o'quvchilar. Ro'yxat har 15 soniyada yangilanadi.">
          <PendingList
            items={overview.pending}
            onPick={(a) => {
              setPrefill(a);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </Box>
      ) : null}

      {status !== "error" ? (
        <Box
          title={`Ko'rib chiqish${review.length ? ` (${review.length})` : ""}`}
          hint="Avtomatik mos kelmagan kirimlar: kimning puli ekanini tanlang yoki Izlan'ga tegishli emas deb belgilang."
          className={review.length ? "bg-tomato/10" : undefined}
        >
          {review.length ? (
            <ul className="space-y-4">
              {review.map((it) => (
                <ReviewCard key={it.id} item={it} onChanged={changed} />
              ))}
            </ul>
          ) : (
            <p className="text-ink/70">Hammasi hal qilingan.</p>
          )}
        </Box>
      ) : null}

      {overview ? (
        <Box title="Oxirgi kirimlar">
          {overview.recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-[3px] border-ink text-left">
                <thead className="bg-ink text-paper">
                  <tr>
                    <th className="label px-3 py-2">Vaqt</th>
                    <th className="label px-3 py-2 text-right">Summa</th>
                    <th className="label px-3 py-2">Holat</th>
                    <th className="label px-3 py-2">Kimga</th>
                    <th className="label px-3 py-2">Manba</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recent.map((r) => (
                    <tr key={r.id} className="border-t-[3px] border-ink">
                      <td className="px-3 py-2 whitespace-nowrap">{fmtTime(r.receivedAt)}</td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums">{formatUzs(r.amount)}</td>
                      <td className="px-3 py-2">
                        <span className={cn("label inline-block border-2 border-ink px-2 py-0.5", STATUS_BG[r.status])}>{STATUS_LABEL[r.status]}</span>
                      </td>
                      <td className="px-3 py-2">
                        {r.username ? `@${r.username}` : "—"}
                        {r.creditedAmount ? <span className="text-ink/60"> (+{formatUzs(r.creditedAmount)})</span> : null}
                      </td>
                      <td className="px-3 py-2 text-ink/70">{r.source === "admin" ? "qo'lda" : r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-ink/70">Hali kirim yo&apos;q.</p>
          )}
        </Box>
      ) : null}

      <ReportBox key={reportKey} />
    </div>
  );
}
