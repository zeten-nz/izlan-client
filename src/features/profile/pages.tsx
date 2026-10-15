import Link from "next/link";
import { notFound } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";
import { EmptyState } from "@/features/notebook/ui";
import { ProfileHeader } from "./identity";
import { BadgeArt } from "./badges";
import type { AchievementsData } from "./AchievementsPanel";
import { fmtDay } from "./format";
import { ProfileView } from "./ProfileView";
import { RewardsView } from "./RewardsView";
import type { CatalogItem, CollectionItem, Equipped, MyProfile, PublicProfile } from "./types";

/** /student/account: shaxsiy profil. */
export async function AccountPage() {
  await requireRole("STUDENT");
  const [profile, collection, achievements] = await Promise.all([
    apiGet<MyProfile>("/profile/me"),
    apiGet<{ items: CollectionItem[]; equipped: Equipped }>("/collection"),
    apiGet<AchievementsData>("/achievements"),
  ]);
  return <ProfileView initial={profile} collection={collection} achievements={achievements} />;
}

/** /u/[username]: ommaviy profil (server maxfiylikni tekshirib bergan ma'lumotni ko'rsatadi). */
export async function PublicProfilePage({ username }: { username: string }) {
  await requireRole("STUDENT");
  const p = await apiGet<PublicProfile>(`/profile/u/${encodeURIComponent(username)}`);
  if (p.isPrivate) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-8">
        <EmptyState title={`@${p.username} profili yopiq`}>
          Bu foydalanuvchi profilini ommaviy qilmagan.
          {p.isOwner && (
            <>
              {" "}
              <Link className="underline" href={`${ROUTES.student}/account`}>
                Sozlamalarni o&apos;zgartirish
              </Link>
            </>
          )}
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[980px] px-4 py-8 sm:px-8 sm:py-10">
      <ProfileHeader username={p.username} displayName={p.displayName} initials={p.initials} bio={p.bio} equipped={p.equipped} />
      {p.level && (
        <p className="label mt-6 inline-block border-[3px] border-ink bg-acid px-3 py-2 [overflow-wrap:anywhere]">
          {p.level.level}-daraja · {p.level.title}
        </p>
      )}
      {p.stats && (
        <section aria-label="O'quv ko'rsatkichlari" className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
            <p className="label">Yakunlangan darslar</p>
            <p className="display-cond mt-1 text-4xl">{p.stats.completedLessons}</p>
          </div>
          <div className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
            <p className="label">Yo&apos;nalishlar</p>
            <p className="mt-1 font-semibold">{p.stats.directions.length ? p.stats.directions.join(", ") : "—"}</p>
          </div>
        </section>
      )}
      {p.achievements && (
        <section className="mt-8">
          <h2 className="label">Yutuqlar</h2>
          {p.achievements.length ? (
            <ul className="mt-2 grid gap-3 sm:grid-cols-2">
              {p.achievements.map((a) => (
                <li
                  key={a.slug}
                  className={`flex items-center gap-3 border-[3px] border-ink px-3 py-2 shadow-[3px_3px_0_0_var(--color-ink)] ${a.showcase ? "bg-acid" : "bg-white"}`}
                >
                  <BadgeArt slug={a.slug} className="size-12 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{a.name}</span>
                    <span className="label block text-[11px]">{fmtDay(a.earnedAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-ink/70">Hali yutuq yo&apos;q.</p>
          )}
        </section>
      )}
    </div>
  );
}

/** /student/rewards */
export async function RewardsPage() {
  await requireRole("STUDENT");
  const [me, cosmetics, izl] = await Promise.all([
    apiGet<MyProfile>("/profile/me"),
    apiGet<{ purchasesEnabled: boolean; items: CatalogItem[] }>("/rewards/cosmetics"),
    apiGet<{ redeemEnabled: boolean; items: { category: string; title: string; note: string; status: string }[] }>("/rewards/izl"),
  ]);
  if (!me) notFound();
  return <RewardsView me={me} items={cosmetics.items} izl={izl.items} />;
}
