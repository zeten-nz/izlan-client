"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { FormAlert } from "@/features/auth/components/fields";
import { apiPost } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { CatalogDirection, Overview, UserDirection } from "../types";
import { Roadmap, type RoadmapLevel } from "./Roadmap";

export const ONBOARDING_EVENT = "izlan:onboarding";
export type OnboardingRequest = { step: "pick" } | { step: "mode"; directionId: string };

type Step =
  | { t: "pick" }
  | { t: "mode"; dirId: string }
  | { t: "level"; dirId: string }
  | { t: "unknown"; dirId: string }
  | { t: "roadmap"; dirId: string };

type Props = { catalog: CatalogDirection[]; directions: UserDirection[]; autoOpen: boolean };

const MAX = 2;

const btn =
  "border-[3px] border-ink px-5 py-3 font-display text-[15px] font-black uppercase tracking-tight shadow-[4px_4px_0_0_var(--color-ink)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_var(--color-ink)]";

function Back({ onClick, children = "← Orqaga" }: { onClick: () => void; children?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid">
      {children}
    </button>
  );
}

export function OnboardingHost({ catalog, directions, autoOpen }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step | null>(null);
  const [dirs, setDirs] = useState(directions);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setDirs(directions), [directions]);

  // Boshqa joydagi tugmalardan ochish
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<OnboardingRequest>).detail;
      setError("");
      setStep(d.step === "pick" ? { t: "pick" } : { t: "mode", dirId: d.directionId });
    };
    window.addEventListener(ONBOARDING_EVENT, onOpen);
    return () => window.removeEventListener(ONBOARDING_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (autoOpen) setStep({ t: "pick" });
  }, [autoOpen]);

  const close = useCallback(
    async (dismissPrompt = false) => {
      setStep(null);
      setError("");
      if (dismissPrompt) await apiPost("/learning/directions/dismiss-prompt", {});
      router.refresh();
    },
    [router],
  );

  // Modal ochiqligida: skrollni to'xtatish, Escape, fokus
  useEffect(() => {
    if (!step) return;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && void close(dirs.length === 0);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [step, close, dirs.length]);

  if (!step) return null;

  const catOf = (id: string) => catalog.find((d) => d.id === id)!;
  const nextPending = (exceptId?: string) => dirs.find((d) => d.currentLevelOrd === null && d.directionId !== exceptId);

  const goNextOrClose = (doneId: string) => {
    const next = nextPending(doneId);
    if (next) setStep({ t: "mode", dirId: next.directionId });
    else void close();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/70 p-0 sm:items-center sm:p-6" role="presentation">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Yo'nalish va daraja"
        className="relative max-h-[94vh] w-full max-w-3xl overflow-y-auto border-[3px] border-ink bg-paper p-5 shadow-[10px_10px_0_0_var(--color-acid)] outline-none sm:p-8"
      >
        <button
          type="button"
          onClick={() => void close(dirs.length === 0)}
          aria-label="Yopish"
          className="label absolute right-3 top-3 border-[3px] border-ink bg-white px-2.5 py-1.5 hover:bg-tomato"
        >
          ✕
        </button>
        <div className="pr-10">
          {step.t === "pick" && (
            <PickStep
              catalog={catalog}
              existing={dirs.map((d) => d.directionId)}
              busy={busy}
              setBusy={setBusy}
              error={error}
              setError={setError}
              onSaved={(o: Overview) => {
                setDirs(o.directions);
                const next = o.directions.find((d) => d.currentLevelOrd === null);
                if (next) setStep({ t: "mode", dirId: next.directionId });
                else void close();
              }}
              onLater={() => void close(true)}
              canLater={dirs.length === 0}
            />
          )}
          {step.t === "mode" && (
            <ModeStep
              title={catOf(step.dirId).title}
              testsReady={catOf(step.dirId).placementReady !== false}
              levelCodes={catOf(step.dirId).levels.map((l) => l.code)}
              busy={busy}
              error={error}
              onZero={async () => {
                setBusy(true);
                setError("");
                const res = await apiPost(`/learning/directions/${step.dirId}/start-from-zero`, {});
                setBusy(false);
                if (!res.ok) return setError(res.message);
                setDirs((ds) => ds.map((d) => (d.directionId === step.dirId ? { ...d, currentLevelOrd: 1 } : d)));
                setStep({ t: "roadmap", dirId: step.dirId });
              }}
              onClaim={() => setStep({ t: "level", dirId: step.dirId })}
              onUnknown={() => setStep({ t: "unknown", dirId: step.dirId })}
              onBack={() => setStep({ t: "pick" })}
            />
          )}
          {step.t === "level" && (
            <LevelStep
              direction={catOf(step.dirId)}
              busy={busy}
              error={error}
              onBack={() => setStep({ t: "mode", dirId: step.dirId })}
              onStart={async (levelOrd) => {
                setBusy(true);
                setError("");
                const res = await apiPost<{ id: string }>(`/learning/directions/${step.dirId}/placement`, { mode: "CLAIMED", levelOrd });
                if (!res.ok) {
                  setBusy(false);
                  return setError(res.message);
                }
                window.location.assign(`/student/test/${res.data.id}`);
              }}
            />
          )}
          {step.t === "unknown" && (
            <UnknownStep
              title={catOf(step.dirId).title}
              busy={busy}
              error={error}
              onBack={() => setStep({ t: "mode", dirId: step.dirId })}
              onStart={async () => {
                setBusy(true);
                setError("");
                const res = await apiPost<{ id: string }>(`/learning/directions/${step.dirId}/placement`, { mode: "UNKNOWN" });
                if (!res.ok) {
                  setBusy(false);
                  return setError(res.message);
                }
                window.location.assign(`/student/test/${res.data.id}`);
              }}
            />
          )}
          {step.t === "roadmap" && (
            <RoadmapStep
              direction={catOf(step.dirId)}
              hasNext={!!nextPending(step.dirId)}
              onDone={() => goNextOrClose(step.dirId)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Heading({ sticker, children, lead }: { sticker: string; children: ReactNode; lead?: ReactNode }) {
  return (
    <>
      <span className="label inline-block -rotate-2 border-[3px] border-ink bg-acid px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">{sticker}</span>
      <h2 className="display-cond mt-4 text-[clamp(34px,6vw,54px)]">{children}</h2>
      {lead && <p className="mt-3 max-w-xl text-lg leading-snug text-ink/80">{lead}</p>}
    </>
  );
}

// ───────────── 1. Yo'nalish tanlash ─────────────

function PickStep({
  catalog,
  existing,
  busy,
  setBusy,
  error,
  setError,
  onSaved,
  onLater,
  canLater,
}: {
  catalog: CatalogDirection[];
  existing: string[];
  busy: boolean;
  setBusy: (b: boolean) => void;
  error: string;
  setError: (s: string) => void;
  onSaved: (o: Overview) => void;
  onLater: () => void;
  canLater: boolean;
}) {
  const [kind, setKind] = useState<"LANGUAGE" | "SUBJECT">("LANGUAGE");
  const [picked, setPicked] = useState<string[]>(existing);
  const list = catalog.filter((d) => d.kind === kind);
  const fresh = picked.filter((id) => !existing.includes(id));

  function toggle(d: CatalogDirection) {
    if (!d.active || existing.includes(d.id)) return;
    setError("");
    if (picked.includes(d.id)) return setPicked(picked.filter((id) => id !== d.id));
    if (picked.length >= MAX) return setError(`Ko'pi bilan ${MAX} ta yo'nalish tanlash mumkin`);
    setPicked([...picked, d.id]);
  }

  async function save() {
    setBusy(true);
    const res = await apiPost<Overview>("/learning/directions", { directionIds: picked });
    setBusy(false);
    if (!res.ok) return setError(res.message);
    onSaved(res.data);
  }

  return (
    <div>
      <Heading sticker="1-qadam" lead={`Ko'pi bilan ${MAX} ta yo'nalish tanlang. Qaror qilmagan bo'lsangiz, keyinroq tanlashingiz mumkin.`}>
        Nimani o&apos;rganamiz<span className="text-tomato">?</span>
      </Heading>

      <div role="tablist" aria-label="Yo'nalish turi" className="mt-6 flex gap-2">
        {(["LANGUAGE", "SUBJECT"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            type="button"
            onClick={() => setKind(k)}
            className={cn("label border-[3px] border-ink px-4 py-2.5", kind === k ? "bg-ink text-paper shadow-[3px_3px_0_0_var(--color-acid)]" : "bg-white hover:bg-acid")}
          >
            {k === "LANGUAGE" ? "Tillar" : "Fanlar"}
          </button>
        ))}
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {list.map((d) => {
          const on = picked.includes(d.id);
          const locked = existing.includes(d.id);
          return (
            <li key={d.id}>
              <button
                type="button"
                disabled={!d.active}
                aria-pressed={on}
                onClick={() => toggle(d)}
                className={cn(
                  "relative h-full w-full border-[3px] border-ink p-4 text-left transition",
                  d.active ? "shadow-[4px_4px_0_0_var(--color-ink)] hover:-translate-y-0.5" : "cursor-not-allowed border-dashed bg-paper-2/60 text-ink/55",
                  on ? "bg-acid" : d.active && "bg-white",
                )}
              >
                <span className="display-cond block text-2xl">{d.title}</span>
                <span className="mt-1 block text-[15px] leading-snug">{d.description}</span>
                <span className="label mt-3 inline-block border-2 border-ink bg-paper px-2 py-1 text-[10px]">
                  {!d.active ? "Tez orada" : locked ? "Tanlangan" : on ? "✓ Tanlandi" : "Tanlash"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 space-y-3">
        <p className="label" aria-live="polite">Tanlandi: {picked.length} / {MAX}</p>
        <FormAlert>{error}</FormAlert>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" onClick={save} disabled={busy || fresh.length === 0} className={cn(btn, "bg-acid")}>
          {busy ? "Kuting..." : "Davom etish →"}
        </button>
        {canLater && (
          <button type="button" onClick={onLater} className="font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid">
            Hali qaror qilmadim, keyinroq
          </button>
        )}
      </div>
    </div>
  );
}

// ───────────── 2. Daraja usuli ─────────────

function ModeStep({
  title,
  testsReady,
  levelCodes,
  busy,
  error,
  onZero,
  onClaim,
  onUnknown,
  onBack,
}: {
  title: string;
  testsReady: boolean;
  levelCodes: string[];
  busy: boolean;
  error: string;
  onZero: () => void;
  onClaim: () => void;
  onUnknown: () => void;
  onBack: () => void;
}) {
  const options: Array<{ key: string; tone: string; h: string; p: string; on: () => void; off?: boolean }> = [
    { key: "zero", tone: "bg-acid", h: "0 dan boshlash", p: levelCodes.length > 1 ? `Hech narsa bilmayman. ${levelCodes[0]} dan boshlab ${levelCodes[levelCodes.length - 1]} gacha yo'l xaritasi tuzamiz.` : "Hech narsa bilmayman. Boshidan yo'l xaritasi tuzamiz.", on: onZero },
    { key: "claim", tone: "bg-sky", h: "Darajani kiritish", p: "Darajamni bilaman. Test topshirib tasdiqlayman, natijaga qarab davom etaman.", on: onClaim, off: !testsReady },
    { key: "unknown", tone: "bg-bubble", h: "Darajamni bilmayman", p: "Birinchi darajadan boshlab savollar bosqichma-bosqich qiyinlashadi, darajangizni o'zimiz aniqlaymiz.", on: onUnknown, off: !testsReady },
  ];
  return (
    <div>
      <Heading sticker={title} lead="Darajangizga qarab sizga mos yo'l xaritasi tuzamiz.">
        Qaysi darajadasiz<span className="text-tomato">?</span>
      </Heading>
      <ul className="mt-6 grid gap-3">
        {options.map((o) => (
          <li key={o.key}>
            <button
              type="button"
              disabled={busy || o.off}
              onClick={o.on}
              className={cn("group w-full border-[3px] border-ink p-4 text-left shadow-[5px_5px_0_0_var(--color-ink)] transition hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_var(--color-ink)] disabled:opacity-60 sm:p-5", o.tone)}
            >
              <span className="display-cond flex items-center justify-between gap-3 text-2xl sm:text-3xl">
                {o.h}
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </span>
              <span className="mt-1 block leading-snug">{o.p}</span>
              {o.off ? <span className="label mt-2 block">Bu yo&apos;nalish uchun test hali tayyor emas</span> : null}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <FormAlert>{error}</FormAlert>
      </div>
      <div className="mt-5">
        <Back onClick={onBack} />
      </div>
    </div>
  );
}

// ───────────── 3a. Darajani kiritish ─────────────

function LevelStep({
  direction,
  busy,
  error,
  onBack,
  onStart,
}: {
  direction: CatalogDirection;
  busy: boolean;
  error: string;
  onBack: () => void;
  onStart: (levelOrd: number) => void;
}) {
  const [ord, setOrd] = useState<number | null>(null);
  const level = direction.levels.find((l) => l.ord === ord);
  return (
    <div>
      <Heading sticker={direction.title} lead="Darajangizni tanlang. Shu daraja bo'yicha test olinadi va natijaga qarab yo'lingiz belgilanadi.">
        Darajangiz
      </Heading>
      <div role="radiogroup" aria-label="Daraja" className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {direction.levels.map((l) => (
          <button
            key={l.ord}
            type="button"
            role="radio"
            aria-checked={ord === l.ord}
            onClick={() => setOrd(l.ord)}
            className={cn(
              "border-[3px] border-ink py-3 text-center shadow-[3px_3px_0_0_var(--color-ink)] transition hover:-translate-y-0.5",
              ord === l.ord ? "bg-acid" : "bg-white",
            )}
          >
            <span className="display block text-2xl">{l.code}</span>
            <span className="label block text-[10px] normal-case tracking-normal">{l.title}</span>
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-5">
        {level ? (
          <div className="border-[3px] border-ink bg-white p-4 shadow-[5px_5px_0_0_var(--color-ink)] sm:p-5">
            <p className="label">{level.code} · {level.title} · {level.vocabHint}</p>
            <p className="display-cond mt-2 text-xl">Bu darajada quyidagilarni bilishingiz kerak:</p>
            <ul className="mt-3 space-y-2">
              {level.canDo.map((c) => (
                <li key={c} className="flex gap-3 leading-snug">
                  <span aria-hidden className="mt-1 grid size-5 shrink-0 place-items-center border-2 border-ink bg-acid text-[11px] font-bold">✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t-[3px] border-ink pt-3 text-sm text-ink/75">
              Test: shu daraja bo&apos;yicha savollar (10 tadan 30 tagacha). 90% dan yuqori bo&apos;lsa keyingi darajaga o&apos;tasiz.
            </p>
          </div>
        ) : (
          <p className="text-ink/70">Daraja tanlang, shunda u nimalarni bilish kerakligini ko&apos;rasiz.</p>
        )}
      </div>
      <div className="mt-4">
        <FormAlert>{error}</FormAlert>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" disabled={busy || !level} onClick={() => level && onStart(level.ord)} className={cn(btn, "bg-acid")}>
          {busy ? "Kuting..." : "Testni boshlash →"}
        </button>
        <Back onClick={onBack} />
      </div>
    </div>
  );
}

// ───────────── 3b. Darajamni bilmayman ─────────────

function UnknownStep({ title, busy, error, onBack, onStart }: { title: string; busy: boolean; error: string; onBack: () => void; onStart: () => void }) {
  return (
    <div>
      <Heading sticker={title} lead="Qisqa test orqali darajangizni o'zimiz aniqlaymiz.">
        Pog&apos;onama-pog&apos;ona
      </Heading>
      <ol className="mt-6 space-y-3">
        {[
          "Savollar A1 dan boshlanadi va har bosqichda qiyinlashib boradi.",
          "Jami 10 tadan 30 tagacha savol beriladi.",
          "Bir bosqichda 75% dan past natija bo'lsa, o'sha daraja sizning darajangiz deb olinadi.",
          "Shu darajani noldan o'rgatamiz va oldingi darajalar ochiq bo'ladi.",
        ].map((t, i) => (
          <li key={t} className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center border-[3px] border-ink bg-acid font-mono text-sm font-bold">{i + 1}</span>
            <span className="pt-0.5 leading-snug">{t}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4">
        <FormAlert>{error}</FormAlert>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" disabled={busy} onClick={onStart} className={cn(btn, "bg-acid")}>
          {busy ? "Kuting..." : "Testni boshlash →"}
        </button>
        <Back onClick={onBack} />
      </div>
    </div>
  );
}

// ───────────── 4. Yo'l xaritasi (0 dan boshlash) ─────────────

function RoadmapStep({ direction, hasNext, onDone }: { direction: CatalogDirection; hasNext: boolean; onDone: () => void }) {
  const levels: RoadmapLevel[] = direction.levels.map((l) => ({
    ord: l.ord,
    code: l.code,
    title: l.title,
    summary: l.summary,
    vocabHint: l.vocabHint,
    state: l.ord === 1 ? "current" : "future",
  }));
  return (
    <div>
      <Heading sticker={direction.title} lead="Noldan boshlab eng yuqori darajagacha shaxsiy yo'lingiz tayyor. Har bosqichni tugatgach keyingisi ochiladi.">
        Yo&apos;l xaritangiz
      </Heading>
      <div className="mt-8">
        <Roadmap levels={levels} variant="preview" />
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={onDone} className={cn(btn, "bg-acid")}>
          {hasNext ? "Keyingi yo'nalish →" : "Boshladik →"}
        </button>
      </div>
    </div>
  );
}
