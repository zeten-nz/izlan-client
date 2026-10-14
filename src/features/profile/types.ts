export type CosmeticKind = "FRAME" | "BANNER" | "EFFECT" | "TITLE";
export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export type Cosmetic = {
  id: string;
  slug: string;
  kind: CosmeticKind;
  rarity: Rarity;
  name: string;
  description: string;
  priceXp: number | null;
  preview: { key?: string } | null;
  season: string | null;
};

export type Equipped = { frame: Cosmetic | null; banner: Cosmetic | null; effect: Cosmetic | null; title: Cosmetic | null };

export type Privacy = { isPublic: boolean; showFullName: boolean; showAchievements: boolean; showStats: boolean };

export type Stats = {
  completedLessons: number;
  directions: string[];
  recent?: { title: string; completedAt: string }[];
  streak: number | null;
};

export type Achievement = { slug: string; name: string; description?: string; earnedAt: string };

export type MyProfile = {
  username: string;
  firstName: string;
  lastName: string;
  initials: string;
  bio: string;
  privacy: Privacy;
  wallet: { xpBalance: number; totalXpEarned: number; izlBalance: number };
  equipped: Equipped;
  stats: Stats;
  achievements: Achievement[];
};

export type PublicProfile =
  | { username: string; isPrivate: true; isOwner?: boolean; redirectedFrom?: string }
  | {
      username: string;
      isPrivate: false;
      isOwner: boolean;
      redirectedFrom?: string;
      displayName: string | null;
      initials: string;
      bio: string;
      equipped: Equipped;
      stats: Pick<Stats, "completedLessons" | "directions" | "streak"> | null;
      achievements: { slug: string; name: string; earnedAt: string }[] | null;
    };

export type CatalogItem = Cosmetic & { owned: boolean; status: "OWNED" | "COMING_SOON" };
export type CollectionItem = Cosmetic & { source: string; acquiredAt: string };

export const KIND_LABEL: Record<CosmeticKind, string> = { FRAME: "Ramka", BANNER: "Banner", EFFECT: "Effekt", TITLE: "Unvon" };
export const RARITY_LABEL: Record<Rarity, string> = { COMMON: "Oddiy", RARE: "Noyob", EPIC: "Epik", LEGENDARY: "Afsonaviy" };
export const KINDS = Object.keys(KIND_LABEL) as CosmeticKind[];
export const RARITIES = Object.keys(RARITY_LABEL) as Rarity[];
