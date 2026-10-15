import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Cosmetic, Equipped, Rarity } from "./types";
import { RARITY_LABEL } from "./types";
import { fmtDay } from "./format";
import { BannerArt, FrameArt, TitleArt, designKeyOf } from "./designs";

/**
 * Qayta ishlatiladigan identifikatsiya komponentlari (profil, kelajakda izohlar/reyting/community).
 * Bezak vizuali server bergan `preview.key` bo'yicha shu yerdagi token'lardan chiziladi: ixtiyoriy CSS/HTML qabul qilinmaydi.
 */

export const RARITY_BG: Record<Rarity, string> = {
  COMMON: "bg-paper-2",
  RARE: "bg-sky",
  EPIC: "bg-bubble",
  LEGENDARY: "bg-acid",
};

const RARITY_COLOR: Record<Rarity, string> = {
  COMMON: "var(--color-ink)",
  RARE: "var(--color-cobalt)",
  EPIC: "var(--color-bubble)",
  LEGENDARY: "var(--color-acid)",
};

/** Noyoblik nishoni. */
export function RarityTag({ rarity, className }: { rarity: Rarity; className?: string }) {
  return <span className={cn("label inline-block border-2 border-ink px-2 py-0.5", RARITY_BG[rarity], className)}>{RARITY_LABEL[rarity]}</span>;
}

type Size = "sm" | "md" | "lg";
const SIZE: Record<Size, { box: string; text: string }> = {
  sm: { box: "size-9", text: "text-sm" },
  md: { box: "size-14", text: "text-xl" },
  lg: { box: "size-20 sm:size-32", text: "text-3xl sm:text-4xl" },
};

/** Avatar ramkasi: individual dizayn (registr). Noma'lum kalit bo'lsa noyoblik rangidagi xavfsiz fallback. */
export function AvatarDecoration({ frame, children, className }: { frame: Cosmetic | null; children: ReactNode; className?: string }) {
  const key = designKeyOf(frame, "FRAME");
  const fallback: CSSProperties | undefined =
    frame && !key ? { boxShadow: `0 0 0 4px ${RARITY_COLOR[frame.rarity]}, 4px 4px 0 4px var(--color-ink)` } : undefined;
  return (
    <div className={cn("relative inline-block shrink-0 border-[3px] border-ink", key && "m-2.5", className)} style={fallback} data-frame={frame?.slug}>
      {children}
      {key && <FrameArt k={key} />}
    </div>
  );
}

/** Avatar: rasm yuklash yo'q, shuning uchun bosh harflar fallback. */
export function UserAvatar({ initials, frame = null, size = "md", className }: { initials: string; frame?: Cosmetic | null; size?: Size; className?: string }) {
  return (
    <AvatarDecoration frame={frame} className={className}>
      <div aria-hidden className={cn("grid place-items-center bg-ink font-display font-black text-paper", SIZE[size].box, SIZE[size].text)}>
        {initials}
      </div>
    </AvatarDecoration>
  );
}

export function UserTitle({ title, className }: { title: Cosmetic | null; className?: string }) {
  if (!title) return null;
  const key = designKeyOf(title, "TITLE");
  if (key) return <TitleArt k={key} label={title.name} className={className} />;
  return <span className={cn("label inline-block max-w-full truncate border-2 border-ink px-2 py-0.5", RARITY_BG[title.rarity], className)}>{title.name}</span>;
}

/** Banner: bezak bo'lmasa Izlan standart ko'rinishi. */
export function ProfileBanner({ banner, effect, className }: { banner: Cosmetic | null; effect?: Cosmetic | null; className?: string }) {
  const key = designKeyOf(banner, "BANNER");
  const bg = banner ? RARITY_BG[banner.rarity] : "bg-acid";
  return (
    <div
      className={cn("relative h-24 overflow-hidden border-[3px] border-ink sm:h-36", !key && bg, className)}
      style={key ? undefined : { backgroundImage: "radial-gradient(var(--color-ink) 1.2px, transparent 1.4px)", backgroundSize: "14px 14px" }}
      data-banner={banner?.slug}
      data-effect={effect?.slug}
    >
      {key && <BannerArt k={key} />}
      {effect && (
        <span className={cn("label absolute right-2 top-2 border-2 border-ink px-2 py-0.5 shadow-[2px_2px_0_0_var(--color-ink)]", RARITY_BG[effect.rarity])}>
          ✦ {effect.name}
        </span>
      )}
    </div>
  );
}

/** Ixcham: izoh/reyting/ro'yxat uchun. */
export function UserIdentity({
  username,
  displayName,
  initials,
  equipped,
  compact,
  bio,
}: {
  username: string;
  displayName?: string | null;
  initials: string;
  equipped?: Equipped | null;
  compact?: boolean;
  bio?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar initials={initials} frame={equipped?.frame ?? null} size={compact ? "sm" : "md"} />
      <div className="min-w-0">
        <p className="truncate font-display text-lg font-black leading-tight">{displayName ?? `@${username}`}</p>
        {displayName && <p className="truncate font-mono text-sm text-ink/70">@{username}</p>}
        <UserTitle title={equipped?.title ?? null} className="mt-1" />
        {!compact && bio && <p className="mt-1 text-sm text-ink/80">{bio}</p>}
      </div>
    </div>
  );
}

export function AchievementBadge({ name, earnedAt }: { name: string; earnedAt?: string }) {
  return (
    <li className="flex items-center gap-2 border-[3px] border-ink bg-white px-3 py-2 shadow-[3px_3px_0_0_var(--color-ink)]">
      <span aria-hidden className="grid size-8 shrink-0 place-items-center border-2 border-ink bg-acid font-black">★</span>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{name}</span>
        {earnedAt && <span className="label block text-[11px]">{fmtDay(earnedAt)}</span>}
      </span>
    </li>
  );
}

/** To'liq profil sarlavhasi (banner + avatar + ism). Preview va haqiqiy profil bir xil shu komponentdan chiziladi. */
export function ProfileHeader({
  username,
  displayName,
  initials,
  bio,
  equipped,
  actions,
}: {
  username: string;
  displayName: string | null;
  initials: string;
  bio: string;
  equipped: Equipped;
  actions?: ReactNode;
}) {
  return (
    <header className="border-[3px] border-ink bg-white shadow-[6px_6px_0_0_var(--color-ink)]">
      <ProfileBanner banner={equipped.banner} effect={equipped.effect} className="h-20 border-0 border-b-[3px] sm:h-36" />
      <div className="px-4 pb-4 sm:px-6 sm:pb-5">
        <div className="-mt-10 flex items-end gap-3 sm:-mt-14 sm:gap-4">
          <UserAvatar initials={initials} frame={equipped.frame} size="lg" className="bg-white" />
          <div className="hidden min-w-0 flex-1 sm:block sm:pb-1">
            <h1 className="display-cond break-words text-4xl leading-none">{displayName ?? `@${username}`}</h1>
            <p className="mt-1 font-mono text-sm text-ink/70">@{username}</p>
          </div>
          {actions && <div className="ml-auto shrink-0 pb-1">{actions}</div>}
        </div>
        <div className="mt-3 min-w-0 sm:hidden">
          <h1 className="display-cond break-words text-3xl leading-none">{displayName ?? `@${username}`}</h1>
          <p className="mt-1 font-mono text-sm text-ink/70">@{username}</p>
        </div>
        <UserTitle title={equipped.title} className="mt-2" />
      </div>
      {bio && <p className="border-t-[3px] border-ink px-4 py-3 text-[17px] sm:px-6">{bio}</p>}
    </header>
  );
}
