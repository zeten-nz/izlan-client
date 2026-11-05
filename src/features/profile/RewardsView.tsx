"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ROUTES } from "@/config/routes";
import { apiGetJson, apiPost, apiSend } from "@/lib/api";
import { cn } from "@/lib/cn";
import { EmptyState, primaryBtn, smallBtn } from "@/features/notebook/ui";
import { CosmeticThumb } from "./designs";
import { fmtDayTime } from "./format";
import { ProfileHeader, RarityTag } from "./identity";
import { KINDS, KIND_LABEL, RARITIES, RARITY_LABEL, type CatalogItem, type Cosmetic, type CosmeticKind, type Equipped, type MyProfile, type Rarity } from "./types";

const SLOT: Record<CosmeticKind, keyof Equipped> = { FRAME: "frame", BANNER: "banner", EFFECT: "effect", TITLE: "title" };

type IzlItem = { category: string; title: string; note: string; status: string };
type Local = CatalogItem & { unavailable?: boolean };
type Purchase = { id: string; pricePaid: number; createdAt: string; status: "COMPLETED"; item: Cosmetic };
type PurchaseOk = { pricePaid: number; balanceAfter: number; level: number; replay: boolean; itemId: string };

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

const newKey = () => `p-${crypto.randomUUID()}`;

/** Xarid tugmasi holatlari (server narxi bo'yicha). */
function buyState(i: Local, balance: number): { label: string; can: boolean } {
  if (i.owned) return { label: "Menda mavjud ✓", can: false };
  if (i.unavailable) return { label: "Hozir mavjud emas", can: false };
  if (i.priceXp === null) return { label: "Narx belgilanmagan", can: false };
  if (balance < i.priceXp) return { label: "XP yetarli emas", can: false };
  return { label: "Sotib olish", can: true };
}

/**
 * Mukofotlar: XP do'koni (bezaklar), IZL (rejalashtirilgan) va xarid tarixi.
 * Narx va xarid natijasi FAQAT serverdan; preview faqat shu komponentning vaqtinchalik holati.
 */
export function RewardsView({ me, items, izl }: { me: MyProfile; items: CatalogItem[]; izl: IzlItem[] }) {
  const [tab, setTab] = useState<"xp" | "izl" | "history">("xp");
  const [list, setList] = useState<Local[]>(items);
  const [balance, setBalance] = useState(me.wallet.xpBalance);
  const [equipped, setEquipped] = useState<Equipped>(me.equipped);
  const [kind, setKind] = useState<CosmeticKind | null>(null);
  const [rarity, setRarity] = useState<Rarity | null>(null);
  const [picked, setPicked] = useState<Local | null>(null);
  const [confirm, setConfirm] = useState<{ item: Local; key: string; note?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState<{ itemId: string; text: string } | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const previewRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const shown = useMemo(() => list.filter((i) => (!kind || i.kind === kind) && (!rarity || i.rarity === rarity)), [list, kind, rarity]);
  const previewEquipped: Equipped = picked ? { ...equipped, [SLOT[picked.kind]]: picked } : equipped;
  const patchItem = (id: string, p: Partial<Local>) => setList((cur) => cur.map((i) => (i.id === id ? { ...i, ...p } : i)));

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (confirm && !d.open) d.showModal();
    if (!confirm && d.open) d.close();
  }, [confirm]);

  function pick(i: Local) {
    const next = picked?.id === i.id ? null : i;
    setPicked(next);
    if (next && typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => previewRef.current?.scrollIntoView({ block: "start" }));
    }
  }

  function askBuy(i: Local) {
    setErr("");
    setConfirm({ item: i, key: newKey() });
  }

  async function doBuy() {
    if (!confirm) return;
    const { item, key } = confirm;
    setBusy(true);
    setErr("");
    const r = await apiPost<PurchaseOk>(`/rewards/cosmetics/${item.id}/purchase`, { idempotencyKey: key, expectedPrice: item.priceXp ?? undefined });
    setBusy(false);
    if (r.ok) {
      setBalance(r.data.balanceAfter);
      patchItem(item.id, { owned: true, status: "OWNED" });
      setNotice({ itemId: item.id, text: `«${item.name}» kolleksiyangizga qo'shildi (−${r.data.pricePaid} XP).` });
      setHistoryVersion((v) => v + 1);
      setConfirm(null);
      return;
    }
    const code = r.code ?? "";
    const fresh = await apiGetJson<{ items: Local[] }>("/rewards/cosmetics");
    if (fresh.ok) setList(fresh.data.items);
    const upd = fresh.ok ? fresh.data.items.find((x) => x.id === item.id) : undefined;
    if (r.status === 409 && upd && upd.priceXp !== null && upd.priceXp !== item.priceXp && upd.status !== "OWNED") {
      setConfirm({ item: upd, key, note: `Narx o'zgargan: endi ${upd.priceXp} XP. Davom etish uchun qayta tasdiqlang.` });
      return;
    }
    if (upd?.owned) patchItem(item.id, { owned: true, status: "OWNED" });
    if (!upd) patchItem(item.id, { unavailable: true });
    setErr(code === "INSUFFICIENT_XP" ? "XP yetarli emas." : r.message);
    if (!upd?.priceXp || upd.owned) setConfirm(null);
  }

  async function equipNow(itemId: string, k: CosmeticKind) {
    const r = await apiSend<{ equipped: Equipped }>("PUT", "/collection/equip", { kind: k, itemId });
    if (r.ok) {
      setEquipped(r.data.equipped);
      setNotice(null);
      setPicked(null);
    } else setErr(r.message);
  }

  const owned = notice ? list.find((i) => i.id === notice.itemId) : null;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-8 sm:py-10">
      <p className="label">Mukofotlar</p>
      <h1 className="display mt-2 text-[clamp(30px,5vw,60px)] [overflow-wrap:anywhere]">Bezaklar va mukofotlar</h1>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <div role="tablist" aria-label="Mukofot turlari" className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-1 sm:flex">
          {(
            [
              ["xp", "XP do'koni"],
              ["izl", "IZL"],
              ["history", "Xaridlarim"],
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
        <p className="label border-[3px] border-ink bg-white px-3 py-2 text-center sm:ml-auto" aria-live="polite">
          XP: <span className="tabular-nums">{balance}</span>
        </p>
        <p className="label border-[3px] border-ink bg-white px-3 py-2 text-center">
          IZL: <span className="tabular-nums">{me.wallet.izlBalance}</span>
        </p>
      </div>

      {notice && (
        <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 border-[3px] border-ink bg-acid p-3 shadow-[4px_4px_0_0_var(--color-ink)]">
          <p className="font-semibold [overflow-wrap:anywhere]">{notice.text}</p>
          <div className="flex flex-wrap gap-2">
            {owned && (
              <button type="button" className={smallBtn} onClick={() => equipNow(owned.id, owned.kind)}>
                Hozir taqish
              </button>
            )}
            <Link href={`${ROUTES.student}/account`} className={smallBtn}>
              Kolleksiyaga o&apos;tish
            </Link>
            <button type="button" className={smallBtn} onClick={() => setNotice(null)} aria-label="Yopish">
              ×
            </button>
          </div>
        </div>
      )}
      {err && !confirm && (
        <p role="alert" className="label mt-4 border-[3px] border-ink bg-tomato px-3 py-2 text-paper [overflow-wrap:anywhere]">
          {err}
        </p>
      )}

      {tab === "xp" && (
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

            {list.length === 0 ? (
              <div className="mt-6">
                <EmptyState title="Katalog hali bo'sh">Bezaklar tez orada qo&apos;shiladi.</EmptyState>
              </div>
            ) : shown.length === 0 ? (
              <div className="mt-6">
                <EmptyState title="Filtrga mos bezak topilmadi" />
              </div>
            ) : (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {shown.map((i) => {
                  const bs = buyState(i, balance);
                  return (
                    <li
                      key={i.id}
                      className={cn(
                        "min-w-0 border-[3px] border-ink shadow-[4px_4px_0_0_var(--color-ink)]",
                        picked?.id === i.id ? "bg-acid" : "bg-white",
                      )}
                    >
                      <button
                        type="button"
                        aria-pressed={picked?.id === i.id}
                        onClick={() => pick(i)}
                        className="block w-full min-w-0 p-3 text-left focus-visible:outline-[3px] focus-visible:-outline-offset-4 focus-visible:outline-cobalt sm:p-4"
                      >
                        <CosmeticThumb item={i} initials={me.initials} />
                        <span className="mt-3 flex items-center justify-between gap-2">
                          <span className="label">{KIND_LABEL[i.kind]}</span>
                          <RarityTag rarity={i.rarity} />
                        </span>
                        <span className="mt-2 block font-display text-lg font-black leading-tight [overflow-wrap:anywhere]">{i.name}</span>
                        <span className="mt-1 line-clamp-2 block text-sm text-ink/75 [overflow-wrap:anywhere]">{i.description}</span>
                      </button>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t-[3px] border-ink px-3 py-2 sm:px-4">
                        <span className="label tabular-nums">{i.priceXp === null ? "Narx yo'q" : `${i.priceXp} XP`}</span>
                        <button type="button" disabled={!bs.can} onClick={() => askBuy(i)} className={cn(bs.can ? primaryBtn : smallBtn, "px-3 py-1.5 text-[12px]")}>
                          {bs.label}
                        </button>
                      </div>
                    </li>
                  );
                })}
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
                  <button
                    type="button"
                    disabled={!buyState(picked, balance).can}
                    onClick={() => askBuy(picked)}
                    className={cn(buyState(picked, balance).can ? primaryBtn : smallBtn, "mt-3 w-full")}
                  >
                    {buyState(picked, balance).label}
                    {buyState(picked, balance).can && picked.priceXp !== null ? ` · ${picked.priceXp} XP` : ""}
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
      )}

      {tab === "izl" && (
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

      {tab === "history" && <PurchaseHistory initials={me.initials} version={historyVersion} />}

      <dialog
        ref={dialogRef}
        aria-labelledby="buy-title"
        onClose={() => !busy && setConfirm(null)}
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
        className="m-auto w-[min(92vw,26rem)] border-[3px] border-ink bg-paper p-0 shadow-[8px_8px_0_0_var(--color-ink)] backdrop:bg-ink/60"
      >
        {confirm && (
          <div className="p-5">
            <h2 id="buy-title" className="display-cond text-2xl">
              Xaridni tasdiqlang
            </h2>
            {confirm.note && <p className="label mt-3 border-2 border-ink bg-acid px-2 py-1.5 [overflow-wrap:anywhere]">{confirm.note}</p>}
            <div className="mt-4">
              <CosmeticThumb item={confirm.item} initials={me.initials} />
            </div>
            <p className="mt-3 font-display text-xl font-black [overflow-wrap:anywhere]">{confirm.item.name}</p>
            <p className="label mt-1">
              {KIND_LABEL[confirm.item.kind]} · {RARITY_LABEL[confirm.item.rarity]}
            </p>
            <dl className="mt-4 border-[3px] border-ink bg-white text-sm">
              {[
                ["Narx", `${confirm.item.priceXp ?? "—"} XP`],
                ["Hozirgi balans", `${balance} XP`],
                ["Xariddan keyin", `${balance - (confirm.item.priceXp ?? 0)} XP`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b-[3px] border-ink px-3 py-2 last:border-b-0">
                  <dt className="label">{k}</dt>
                  <dd className="font-bold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-ink/80">Bezak doimiy kolleksiyangizga qo&apos;shiladi. Daraja pasaymaydi, jami XP o&apos;zgarmaydi.</p>
            {err && (
              <p role="alert" className="label mt-3 border-2 border-ink bg-tomato px-2 py-1 text-paper [overflow-wrap:anywhere]">
                {err}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className={primaryBtn} disabled={busy || confirm.item.priceXp === null || balance < confirm.item.priceXp} onClick={doBuy}>
                {busy ? "Xarid qilinmoqda..." : "Tasdiqlash"}
              </button>
              <button type="button" className={smallBtn} disabled={busy} onClick={() => setConfirm(null)}>
                Bekor qilish
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}

function PurchaseHistory({ initials, version }: { initials: string; version: number }) {
  const [items, setItems] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (p: number, replace: boolean) => {
    setBusy(true);
    const r = await apiGetJson<{ items: Purchase[]; total: number }>(`/rewards/purchases?page=${p}&limit=10`);
    setBusy(false);
    if (!r.ok) return setStatus("error");
    setItems((cur) => (replace ? r.data.items : [...cur, ...r.data.items]));
    setTotal(r.data.total);
    setPage(p);
    setStatus("ready");
  }, []);

  useEffect(() => {
    apiGetJson<{ items: Purchase[]; total: number }>("/rewards/purchases?page=1&limit=10").then((r) => {
      if (!r.ok) return setStatus("error");
      setItems(r.data.items);
      setTotal(r.data.total);
      setPage(1);
      setStatus("ready");
    });
  }, [version]);

  return (
    <section aria-label="Xarid tarixi" className="mt-6">
      {status === "loading" && <p className="label">Yuklanmoqda...</p>}
      {status === "error" && (
        <EmptyState title="Xarid tarixini yuklab bo'lmadi" action={<button type="button" className={smallBtn} onClick={() => load(1, true)}>Qayta urinish</button>} />
      )}
      {status === "ready" && items.length === 0 && <EmptyState title="Hali xarid yo'q">XP do&apos;konidan birinchi bezakni sotib oling.</EmptyState>}
      {status === "ready" && items.length > 0 && (
        <>
          <ul className="space-y-3">
            {items.map((p) => (
              <li key={p.id} className="grid grid-cols-[88px_1fr] items-center gap-3 border-[3px] border-ink bg-white p-3 sm:grid-cols-[120px_1fr_auto]">
                <CosmeticThumb item={p.item} initials={initials} />
                <div className="min-w-0">
                  <p className="font-display text-lg font-black leading-tight [overflow-wrap:anywhere]">{p.item.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2">
                    <RarityTag rarity={p.item.rarity} />
                    <span className="label">{KIND_LABEL[p.item.kind]}</span>
                  </p>
                  <p className="label mt-1 text-[11px]">{fmtDayTime(p.createdAt)}</p>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:block sm:text-right">
                  <span className="label border-2 border-ink bg-acid px-2 py-0.5">Yakunlangan</span>
                  <p className="font-display text-xl font-black tabular-nums sm:mt-1">−{p.pricePaid} XP</p>
                </div>
              </li>
            ))}
          </ul>
          {items.length < total && (
            <button type="button" disabled={busy} className={cn(smallBtn, "mt-3 w-full sm:w-auto")} onClick={() => load(page + 1, false)}>
              {busy ? "..." : `Yana yuklash (${items.length} / ${total})`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
