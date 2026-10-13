"use client";

import { Reorder, useDragControls } from "motion/react";
import { cn } from "@/lib/cn";
import { STAGE_H, STAGE_W, type Block, type Page } from "../types";

const TINT: Record<Block["type"], string> = {
  heading: "bg-ink",
  text: "bg-ink/40",
  callout: "bg-acid",
  image: "bg-sky",
  audio: "bg-bubble",
  choice: "bg-cobalt/70",
  fillblank: "bg-tomato/70",
};

/** Kichik oldindan ko'rinish: bloklar rangli to'rtburchak sifatida (tez va yengil). */
function Thumb({ page }: { page: Page }) {
  return (
    <div className="relative w-full border-2 border-ink bg-white" style={{ aspectRatio: "16 / 9" }}>
      {[...page.blocks]
        .sort((a, b) => a.z - b.z)
        .map((b) => (
          <div
            key={b.id}
            className={cn("absolute", TINT[b.type])}
            style={{ left: `${(b.x / STAGE_W) * 100}%`, top: `${(b.y / STAGE_H) * 100}%`, width: `${(b.w / STAGE_W) * 100}%`, height: `${(b.h / STAGE_H) * 100}%`, opacity: 0.85 }}
          />
        ))}
    </div>
  );
}

type Props = {
  pages: Page[];
  currentId: string;
  horizontal: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (pages: Page[]) => void;
};

export function PageList({ pages, currentId, horizontal, onSelect, onAdd, onDuplicate, onDelete, onReorder }: Props) {
  return (
    <div className={cn(horizontal ? "flex items-stretch gap-3 overflow-x-auto pb-2" : "space-y-3")}>
      <Reorder.Group
        axis={horizontal ? "x" : "y"}
        values={pages}
        onReorder={onReorder}
        className={cn(horizontal ? "flex gap-3" : "space-y-3")}
        as="ol"
      >
        {pages.map((p, i) => (
          <PageItem
            key={p.id}
            page={p}
            index={i}
            active={p.id === currentId}
            horizontal={horizontal}
            canDelete={pages.length > 1}
            onSelect={() => onSelect(p.id)}
            onDuplicate={() => onDuplicate(p.id)}
            onDelete={() => onDelete(p.id)}
          />
        ))}
      </Reorder.Group>
      <button
        type="button"
        onClick={onAdd}
        className={cn(
          "border-[3px] border-dashed border-ink bg-white font-bold hover:bg-acid",
          horizontal ? "w-32 shrink-0 self-stretch" : "w-full py-3",
        )}
      >
        + Sahifa
      </button>
    </div>
  );
}

function PageItem({
  page,
  index,
  active,
  horizontal,
  canDelete,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  page: Page;
  index: number;
  active: boolean;
  horizontal: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={page} dragListener={false} dragControls={controls} className={cn("list-none", horizontal && "w-40 shrink-0")}>
      <div className={cn("border-[3px] border-ink p-1.5", active ? "bg-acid shadow-[4px_4px_0_0_var(--color-ink)]" : "bg-paper")}>
        <button type="button" onClick={onSelect} className="block w-full text-left" aria-current={active} aria-label={`${index + 1}-sahifa`}>
          <Thumb page={page} />
        </button>
        <div className="mt-1.5 flex items-center justify-between gap-1">
          <span
            className="label cursor-grab touch-none select-none px-1 active:cursor-grabbing"
            onPointerDown={(e) => controls.start(e)}
            title="Tartibini o'zgartirish uchun torting"
          >
            ⠿ {index + 1}
            {page.gate !== "free" ? " 🔒" : ""}
          </span>
          <span className="flex gap-1">
            <button type="button" className="border-2 border-ink bg-white px-1.5 text-xs font-bold hover:bg-acid" onClick={onDuplicate} title="Sahifadan nusxa" aria-label="Sahifadan nusxa olish">
              ⧉
            </button>
            <button
              type="button"
              className="border-2 border-ink bg-white px-1.5 text-xs font-bold hover:bg-tomato disabled:opacity-30"
              disabled={!canDelete}
              onClick={onDelete}
              title="Sahifani o'chirish"
              aria-label="Sahifani o'chirish"
            >
              ✕
            </button>
          </span>
        </div>
      </div>
    </Reorder.Item>
  );
}
