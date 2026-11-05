"use client";

import Link from "next/link";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { apiSend } from "@/lib/api";
import { cn } from "@/lib/cn";
import { EmptyState, smallBtn } from "@/features/notebook/ui";
import { RarityTag } from "./identity";
import { KINDS, KIND_LABEL, type CollectionItem, type CosmeticKind, type Equipped } from "./types";

const SLOT: Record<CosmeticKind, keyof Equipped> = { FRAME: "frame", BANNER: "banner", EFFECT: "effect", TITLE: "title" };

/** Mening kolleksiyam: egalik doimiy; har turdan bittadan faol, yechish mumkin. Server egalikni qayta tekshiradi. */
export function CollectionPanel({
  items,
  equipped,
  onEquipped,
}: {
  items: CollectionItem[];
  equipped: Equipped;
  onEquipped: (e: Equipped) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function equip(kind: CosmeticKind, itemId: string | null) {
    setBusy(itemId ?? kind);
    setError("");
    const r = await apiSend<{ equipped: Equipped }>("PUT", "/collection/equip", { kind, itemId });
    setBusy(null);
    if (r.ok) onEquipped(r.data.equipped);
    else setError(r.message);
  }

  if (!items.length) {
    return (
      <EmptyState
        title="Kolleksiyangiz bo'sh"
        action={
          <Link href={`${ROUTES.student}/rewards`} className={smallBtn}>
            Mukofotlarni ko&apos;rish
          </Link>
        }
      >
        Olingan bezaklar doimiy sizniki bo&apos;lib qoladi.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <p role="alert" className="label border-[3px] border-ink bg-tomato px-3 py-2 text-paper">
          {error}
        </p>
      )}
      {KINDS.map((kind) => {
        const list = items.filter((i) => i.kind === kind);
        const active = equipped[SLOT[kind]];
        return (
          <section key={kind} aria-label={KIND_LABEL[kind]}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="display-cond text-2xl">{KIND_LABEL[kind]}</h3>
              {active && (
                <button type="button" className={smallBtn} disabled={busy !== null} onClick={() => equip(kind, null)}>
                  Yechish
                </button>
              )}
            </div>
            {list.length === 0 ? (
              <p className="mt-2 text-ink/70">Bu turdan bezak yo&apos;q.</p>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {list.map((i) => {
                  const on = active?.id === i.id;
                  return (
                    <li key={i.id} className={cn("flex items-center justify-between gap-3 border-[3px] border-ink p-3", on ? "bg-acid" : "bg-white")}>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{i.name}</p>
                        <RarityTag rarity={i.rarity} className="mt-1" />
                      </div>
                      {on ? (
                        <span className="label">Faol ✓</span>
                      ) : (
                        <button type="button" className={smallBtn} disabled={busy !== null} onClick={() => equip(kind, i.id)}>
                          {busy === i.id ? "..." : "Taqish"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
