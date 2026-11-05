"use client";

import Link from "next/link";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { apiSend } from "@/lib/api";
import { cn } from "@/lib/cn";
import { EmptyState, Field, inputCls, primaryBtn, smallBtn } from "@/features/notebook/ui";
import { LogoutButton } from "@/features/student/LogoutButton";
import { CollectionPanel } from "./CollectionPanel";
import { ProfileHeader } from "./identity";
import { LevelCard, XpHistory } from "./xp";
import { AchievementsPanel, type AchievementsData } from "./AchievementsPanel";
import { fmtDay } from "./format";
import { levelFallback } from "./levels";
import type { CollectionItem, Equipped, MyProfile, Privacy } from "./types";

const TABS = [
  { id: "umumiy", label: "Umumiy" },
  { id: "yutuqlar", label: "Yutuqlar" },
  { id: "kolleksiya", label: "Kolleksiya" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const PRIVACY_ROWS: { key: keyof Privacy; label: string; hint: string }[] = [
  { key: "isPublic", label: "Profilim ommaviy", hint: "O'chiq bo'lsa, boshqalar faqat foydalanuvchi nomingizni ko'radi" },
  { key: "showFullName", label: "To'liq ismimni ko'rsat", hint: "Standart holatda yashirin" },
  { key: "showAchievements", label: "Yutuqlarimni ko'rsat", hint: "Faqat ommaviy profilda ta'sir qiladi" },
  { key: "showStats", label: "O'quv statistikamni ko'rsat", hint: "Faqat ommaviy profilda ta'sir qiladi" },
];

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0 border-[3px] border-ink bg-white p-2.5 shadow-[3px_3px_0_0_var(--color-ink)] sm:p-4 sm:shadow-[4px_4px_0_0_var(--color-ink)]">
      <p className="label truncate text-[10px] sm:text-xs">{label}</p>
      <p className="display-cond mt-0.5 text-2xl tabular-nums sm:mt-1 sm:text-4xl">{value}</p>
      {note && <p className="mt-0.5 hidden text-sm text-ink/70 sm:block">{note}</p>}
    </div>
  );
}

function Settings({ profile, onSaved }: { profile: MyProfile; onSaved: (bio: string, p: Privacy) => void }) {
  const [bio, setBio] = useState(profile.bio);
  const [priv, setPriv] = useState<Privacy>(profile.privacy);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await apiSend("PATCH", "/profile/me", { bio, ...priv });
    setBusy(false);
    if (r.ok) {
      setMsg({ ok: true, text: "Saqlandi" });
      onSaved(bio, priv);
    } else setMsg({ ok: false, text: r.message });
  }

  return (
    <section aria-label="Profil sozlamalari" className="border-[3px] border-ink bg-paper-2 p-4 sm:p-6">
      <Field label="Bio" hint={`${bio.length}/160`}>
        <textarea className={cn(inputCls, "min-h-24")} value={bio} maxLength={160} onChange={(e) => setBio(e.target.value)} />
      </Field>
      <fieldset className="mt-5">
        <legend className="label">Maxfiylik</legend>
        <ul className="mt-2 space-y-2">
          {PRIVACY_ROWS.map((r) => (
            <li key={r.key}>
              <label className="flex cursor-pointer items-start gap-3 border-[3px] border-ink bg-white p-3">
                <input
                  type="checkbox"
                  className="mt-1 size-5 accent-ink"
                  checked={priv[r.key]}
                  onChange={(e) => setPriv({ ...priv, [r.key]: e.target.checked })}
                />
                <span>
                  <span className="block font-semibold">{r.label}</span>
                  <span className="block text-sm text-ink/70">{r.hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-ink/70">Email va IZL balansingiz hech qachon boshqalarga ko&apos;rinmaydi.</p>
      </fieldset>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className={primaryBtn} disabled={busy} onClick={save}>
          {busy ? "Saqlanmoqda..." : "Saqlash"}
        </button>
        {msg && (
          <p role={msg.ok ? "status" : "alert"} className={cn("label border-2 border-ink px-2 py-1", msg.ok ? "bg-acid" : "bg-tomato text-paper")}>
            {msg.text}
          </p>
        )}
      </div>
    </section>
  );
}

export function ProfileView({
  initial,
  collection,
  achievements,
}: {
  initial: MyProfile;
  collection: { items: CollectionItem[]; equipped: Equipped };
  achievements: AchievementsData;
}) {
  const [profile, setProfile] = useState(initial);
  const [tab, setTab] = useState<TabId>("umumiy");
  const [editing, setEditing] = useState(false);
  const [equipped, setEquipped] = useState(collection.equipped);
  const display = `${profile.firstName} ${profile.lastName}`;
  const w = profile.wallet;
  const s = profile.stats;

  function onKey(e: React.KeyboardEvent, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = (i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setTab(TABS[n].id);
    document.getElementById(`tab-${TABS[n].id}`)?.focus();
  }

  return (
    <div className="mx-auto max-w-[980px] px-4 py-5 sm:px-8 sm:py-10">
      <ProfileHeader
        username={profile.username}
        displayName={display}
        initials={profile.initials}
        bio={profile.bio}
        equipped={equipped}
        actions={
          <button type="button" className={smallBtn} aria-expanded={editing} onClick={() => setEditing((v) => !v)}>
            {editing ? "Yopish" : "Tahrirlash"}
          </button>
        }
      />
      <p className="mt-3 text-sm">
        <span className={cn("label border-2 border-ink px-2 py-0.5", profile.privacy.isPublic ? "bg-acid" : "bg-paper-2")}>
          {profile.privacy.isPublic ? "Ommaviy profil" : "Yopiq profil"}
        </span>{" "}
        {profile.privacy.isPublic && (
          <Link className="font-semibold underline" href={`/u/${profile.username}`}>
            Ommaviy ko&apos;rinish →
          </Link>
        )}
      </p>

      {editing && (
        <div className="mt-6">
          <Settings
            profile={profile}
            onSaved={(bio, privacy) => setProfile((p) => ({ ...p, bio, privacy }))}
          />
        </div>
      )}

      <div role="tablist" aria-label="Profil bo'limlari" className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:flex sm:flex-wrap">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "label border-[3px] border-ink px-1 py-2 text-center text-[11px] tracking-tight sm:px-4 sm:text-xs sm:tracking-normal focus-visible:outline-[3px] focus-visible:outline-cobalt",
              tab === t.id ? "bg-ink text-paper shadow-[3px_3px_0_0_var(--color-acid)]" : "bg-white hover:bg-acid",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === "umumiy" && (
          <div className="space-y-6 sm:space-y-8">
            <LevelCard level={profile.xp?.level ?? levelFallback()} totalXp={w.totalXpEarned} balance={w.xpBalance} />
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <Stat label="XP" value={String(w.xpBalance)} note="Bezaklar uchun sarflanadi" />
              <Stat label="Jami XP" value={String(w.totalXpEarned)} note="Hech qachon kamaymaydi" />
              <Stat label="IZL" value={String(w.izlBalance)} note="Faqat sizga ko'rinadi" />
            </div>
            <p className="border-l-[6px] border-ink pl-3 text-sm text-ink/80">
              XP dars, mavzu va mavzu testi uchun beriladi. Daraja jami XP bo&apos;yicha hisoblanadi va bezak sotib olinsa ham pasaymaydi. IZL hali berilmaydi.
            </p>

            <section aria-label="O'quv ko'rsatkichlari" className="grid grid-cols-2 gap-2 sm:gap-4">
              <Stat label="Yakunlangan darslar" value={String(s.completedLessons)} />
              <Stat label="Streak" value={s.streak === null ? "—" : String(s.streak)} note={s.streak === null ? "Ma'lumot manbai hali yo'q" : undefined} />
            </section>

            <section>
              <h2 className="label">Yo&apos;nalishlar</h2>
              {s.directions.length ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {s.directions.map((d) => (
                    <li key={d} className="border-[3px] border-ink bg-sky px-3 py-1.5 font-semibold">
                      {d}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Yo'nalish tanlanmagan">
                  <Link href={`${ROUTES.student}/directions`} className="underline">
                    Yo&apos;nalishlarga o&apos;tish
                  </Link>
                </EmptyState>
              )}
            </section>

            <section aria-label="XP tarixi">
              <h2 className="label">XP tarixi</h2>
              <div className="mt-2">
                <XpHistory />
              </div>
            </section>

            <section>
              <h2 className="label">So&apos;nggi faoliyat</h2>
              {s.recent?.length ? (
                <ul className="mt-2 border-[3px] border-ink bg-white">
                  {s.recent.map((r, i) => (
                    <li key={i} className="flex flex-wrap justify-between gap-2 border-b-[3px] border-ink px-4 py-3 last:border-b-0">
                      <span className="font-semibold">{r.title}</span>
                      <span className="label">{fmtDay(r.completedAt)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Hali yakunlangan dars yo'q" />
              )}
            </section>

            <div>
              <LogoutButton />
            </div>
          </div>
        )}

        {tab === "yutuqlar" && <AchievementsPanel data={achievements} />}

        {tab === "kolleksiya" && <CollectionPanel items={collection.items} equipped={equipped} onEquipped={setEquipped} />}
      </div>
    </div>
  );
}
