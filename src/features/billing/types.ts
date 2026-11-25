export type LedgerKind = "TOPUP" | "PURCHASE" | "ADJUST";

export type TopupConfig = { enabled: boolean; min: number; max: number; step: number };

export type TopupView = {
  id: string;
  baseAmount: number;
  /** O'tkaziladigan noyob summa (baseAmount + 1..99) */
  amount: number;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  createdAt: string;
  expiresAt: string;
  closedAt: string | null;
  card: { number: string; holder: string } | null;
};

export type WalletView = {
  balanceUzs: number;
  topup: TopupConfig & { pending: TopupView | null };
  history: Array<{
    id: string;
    kind: LedgerKind;
    amount: number;
    balanceAfter: number;
    directionTitle: string | null;
    note: string | null;
    createdAt: string;
  }>;
  access: Array<{ directionId: string; directionTitle: string; endsAt: string; active: boolean }>;
};

export type CourseView = {
  id: string;
  slug: string;
  kind: "LANGUAGE" | "SUBJECT";
  title: string;
  description: string;
  monthlyPriceUzs: number | null;
  levels: string[];
  accessDays: number;
  endsAt: string | null;
  active: boolean;
};

export type CoursesView = { balanceUzs: number; courses: CourseView[] };
