"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { EmptyState, smallBtn } from "@/features/notebook/ui";
import { CosmeticThumb } from "./designs";
import { ProfileHeader, RarityTag } from "./identity";
import { KINDS, KIND_LABEL, RARITIES, RARITY_LABEL, type CatalogItem, type CosmeticKind, type Equipped, type MyProfile, type Rarity } from "./types";

const SLOT: Record<CosmeticKind, keyof Equipped> = { FRAME: "frame", BANNER: "banner", EFFECT: "effect", TITLE: "title" };

type IzlItem = { category: string; title: string; note: string; status: string };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "label shrink-0 snap-start whitespace-nowrap border-[3px] border-ink px-3 py-1.5 focus-visible:outline-[3px] focus-visible:outline-cobalt",
        active ? "bg-ink text-paper" : "bg-white hover:bg-acid",
      )}
    >
      {children}
    </button>
  );
}

/** Filtr qatori: mobilda gorizontal scroll (sahifa kengaymaydi), desktopda o'raladi. */
function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {children}
    </div>
  );
}

/**
 * Mukofotlar: XP do'koni (bezaklar) va IZL (rejalashtirilgan). Preview faqat shu komponentning vaqtinchalik holati:
 * serverga hech narsa yuborilmaydi. Xarid yoqilmagan.
 */
export function RewardsView({ me, items, izl }: { me: MyProfile; items: CatalogItem[]; izl: IzlItem[] }) {
  const [tab, setTab] = useState<"xp" | "izl">("xp");
  const [kind, setKind] = useState<CosmeticKind | null>(null);
  const [rarity, setRarity] = useState<Rarity | null>(null);
  const [picked, setPicked] = useState<CatalogItem | null>(null);
  const previewRef = useRef<HTMLElement>(null);

  const shown = useMemo(() => items.filter((i) => (!kind || i.kind === kind) && (!rarity || i.rarity === rarity)), [items, kind, rarity]);
  // Preview faqat tanlangan turdagi slotni almashtiradi: boshqa jihozlangan bezaklar saqlanadi
  const previewEquipped: Equipped = picked ? { ...me.equipped, [SLOT[picked.kind]]: picked } : me.equipped;

  function pick(i: CatalogItem) {
    const next = picked?.id === i.id ? null : i;
    setPicked(next);
    if (next && typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => previewRef.current?.scrollIntoView({ block: "start" }));
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-8 sm:py-10">
      <p className="label">Mukofotlar</p>
      <h1 className="display mt-2 text-[clamp(30px,5vw,60px)] [overflow-wrap:anywhere]">Bezaklar va mukofotlar</h1>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <div role="tablist" aria-label="Mukofot turlari" className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:flex">
          {(
            [
              ["xp", "XP do'koni"],
              ["izl", "IZL mukofotlari"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "label border-[3px] border-ink px-2 py-2 text-center text-[11px] tracking-tight sm:px-4 sm:text-xs sm:tracking-normal",
                tab === id ? "bg-ink text-paper shadow-[3px_3px_0_0_var(--color-acid)]" : "bg-white hover:bg-acid",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="label border-[3px] border-ink bg-white px-3 py-2 text-center sm:ml-auto">
          XP: <span className="tabular-nums">{me.wallet.xpBalance}</span>
        </p>
        <p className="label border-[3px] border-ink bg-white px-3 py-2 text-center">
          IZL: <span className="tabular-nums">{me.wallet.izlBalance}</span>
        </p>
      </div>

      {tab === "xp" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
          <div className="min-w-0">
            <div className="space-y-2" aria-label="Filtrlar">
              <ChipRow label="Tur">
                <Chip active={kind === null} onClick={() => setKind(null)}>Hammasi</Chip>
                {KINDS.map((k) => (
                  <Chip key={k} active={kind === k} onClick={() => setKind(kind === k ? null : k)}>
                    {KIND_LABEL[k]}
                  </Chip>
                ))}
              </ChipRow>
              <ChipRow label="Noyoblik">
                <Chip active={rarity === null} onClick={() => setRarity(null)}>Barcha noyoblik</Chip>
                {RARITIES.map((r) => (
                  <Chip key={r} active={rarity === r} onClick={() => setRarity(rarity === r ? null : r)}>
                    {RARITY_LABEL[r]}
                  </Chip>
                ))}
              </ChipRow>
            </div>

            {items.length === 0 ? (
              <div className="mt-6">
                <EmptyState title="Katalog hali bo'sh">Bezaklar tez orada qo&apos;shiladi.</EmptyState>
              </div>
            ) : shown.length === 0 ? (
              <div className="mt-6">
                <EmptyState title="Filtrga mos bezak topilmadi" />
              </div>
            ) : (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {shown.map((i) => (
                  <li key={i.id} className="min-w-0">
                    <button
                      type="button"
                      aria-pressed={picked?.id === i.id}
                      onClick={() => pick(i)}
                      className={cn(
                        "block w-full min-w-0 border-[3px] border-ink p-3 text-left shadow-[4px_4px_0_0_var(--color-ink)] transition hover:-translate-y-0.5 focus-visible:outline-[3px] focus-visible:outline-cobalt sm:p-4",
                        picked?.id === i.id ? "bg-acid" : "bg-white",
                      )}
                    >
                      <CosmeticThumb item={i} initials={me.initials} />
                      <span className="mt-3 flex items-center justify-between gap-2">
                        <span className="label">{KIND_LABEL[i.kind]}</span>
                        <RarityTag rarity={i.rarity} />
                      </span>
                      <span className="mt-2 block font-display text-lg font-black leading-tight [overflow-wrap:anywhere]">{i.name}</span>
                      <span className="mt-1 line-clamp-2 block text-sm text-ink/75 [overflow-wrap:anywhere]">{i.description}</span>
                      <span className="label mt-2 block">
                        {i.owned ? "Sizda bor ✓" : i.priceXp === null ? "Narx belgilanmagan" : `${i.priceXp} XP`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside
            ref={previewRef}
            aria-label="Profil preview"
            className={cn("min-w-0 scroll-mt-20 lg:sticky lg:top-6 lg:order-none lg:self-start", picked && "order-first")}
          >
            <p className="label [overflow-wrap:anywhere]">Preview {picked ? `· ${picked.name}` : ""}</p>
            <div className="mt-2">
              <ProfileHeader
                username={me.username}
                displayName={`${me.firstName} ${me.lastName}`}
                initials={me.initials}
                bio={me.bio}
                equipped={previewEquipped}
              />
            </div>
            <div className="mt-4 border-[3px] border-ink bg-white p-4">
              {picked ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 font-display text-xl font-black [overflow-wrap:anywhere]">{picked.name}</p>
                    <RarityTag rarity={picked.rarity} className="shrink-0" />
                  </div>
                  <p className="mt-1 text-sm [overflow-wrap:anywhere]">{picked.description}</p>
                  {picked.season && <p className="label mt-2">Mavsum: {picked.season}</p>}
                  <button type="button" disabled className={cn(smallBtn, "mt-3 w-full")}>
                    Xarid tez kunda
                  </button>
                  <button type="button" className={cn(smallBtn, "mt-2 w-full")} onClick={() => setPicked(null)}>
                    Preview&apos;ni yopish
                  </button>
                </>
              ) : (
                <p className="text-sm text-ink/75">Bezakni tanlang: u profilingizda qanday ko&apos;rinishini shu yerda ko&apos;rasiz. Haqiqiy profilingiz o&apos;zgarmaydi.</p>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <section aria-label="IZL mukofotlari" className="mt-6">
          <p className="max-w-2xl text-ink/80">
            IZL — real qiymatli mukofotlar uchun mo&apos;ljallangan alohida valyuta. Quyidagilar rejalashtirilgan yo&apos;nalishlar: narx, mavjudlik va
            yetkazib berish hali belgilanmagan.
          </p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {izl.map((x) => (
              <li key={x.category} className="border-[3px] border-dashed border-ink bg-white p-5">
                <span className="label border-2 border-ink bg-paper-2 px-2 py-0.5">Rejalashtirilgan</span>
                <p className="display-cond mt-3 text-2xl">{x.title}</p>
                <p className="mt-1 text-ink/75">{x.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
