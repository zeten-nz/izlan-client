"use client";

import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { BlockView } from "../blocks/BlockView";
import { useElementWidth } from "../PageView";
import { stageFrameHeight, stageLayerStyle, stageScale, useDevicePixelRatio } from "../stage";
import { STAGE_H, STAGE_W, type Block, type Page } from "../types";

type Rect = { x: number; y: number; w: number; h: number };
type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
type Guide = { axis: "x" | "y"; pos: number };

const GRID = 8;
const SNAP = 10;
const MIN = 40;
const HANDLES: { h: Handle; cx: number; cy: number; cursor: string }[] = [
  { h: "nw", cx: 0, cy: 0, cursor: "nwse-resize" },
  { h: "n", cx: 0.5, cy: 0, cursor: "ns-resize" },
  { h: "ne", cx: 1, cy: 0, cursor: "nesw-resize" },
  { h: "e", cx: 1, cy: 0.5, cursor: "ew-resize" },
  { h: "se", cx: 1, cy: 1, cursor: "nwse-resize" },
  { h: "s", cx: 0.5, cy: 1, cursor: "ns-resize" },
  { h: "sw", cx: 0, cy: 1, cursor: "nesw-resize" },
  { h: "w", cx: 0, cy: 0.5, cursor: "ew-resize" },
];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Qiymatlar (chekka/markaz) ichida maqsadlarga eng yaqinini topadi. */
function snapAxis(values: number[], targets: number[]): { delta: number; guide: number } | null {
  let best: { delta: number; guide: number } | null = null;
  for (const v of values) {
    for (const t of targets) {
      const d = t - v;
      if (Math.abs(d) <= SNAP && (!best || Math.abs(d) < Math.abs(best.delta))) best = { delta: d, guide: t };
    }
  }
  return best;
}

type Props = {
  page: Page;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Surish/o'lcham o'zgartirish tugadi */
  onFrame: (id: string, rect: Rect) => void;
  onOpenText: (id: string) => void;
};

export function Canvas({ page, selectedId, onSelect, onFrame, onOpenText }: Props) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const dpr = useDevicePixelRatio();
  const scale = stageScale(width, dpr);
  const [live, setLive] = useState<({ id: string } & Rect) | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);

  const rectOf = (b: Block): Rect => (live && live.id === b.id ? live : b);

  const begin = (e: ReactPointerEvent, b: Block, mode: "move" | Handle) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (mode === "move") onSelect(b.id);
    const sx = e.clientX;
    const sy = e.clientY;
    const start: Rect = { x: b.x, y: b.y, w: b.w, h: b.h };
    const others = page.blocks.filter((o) => o.id !== b.id);
    const xTargets = [0, STAGE_W / 2, STAGE_W, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])];
    const yTargets = [0, STAGE_H / 2, STAGE_H, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])];
    let last: Rect = start;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      const k = scale || 1;
      const dx = (ev.clientX - sx) / k;
      const dy = (ev.clientY - sy) / k;
      if (!moved && Math.hypot(dx, dy) * k < 3) return;
      moved = true;
      const free = ev.altKey; // Alt = yopishishsiz
      const g: Guide[] = [];
      let r: Rect;

      if (mode === "move") {
        let nx = start.x + dx;
        let ny = start.y + dy;
        if (!free) {
          const sxn = snapAxis([nx, nx + start.w / 2, nx + start.w], xTargets);
          const syn = snapAxis([ny, ny + start.h / 2, ny + start.h], yTargets);
          if (sxn) {
            nx += sxn.delta;
            g.push({ axis: "x", pos: sxn.guide });
          } else nx = Math.round(nx / GRID) * GRID;
          if (syn) {
            ny += syn.delta;
            g.push({ axis: "y", pos: syn.guide });
          } else ny = Math.round(ny / GRID) * GRID;
        }
        r = { ...start, x: clamp(nx, 0, STAGE_W - start.w), y: clamp(ny, 0, STAGE_H - start.h) };
      } else {
        let left = start.x;
        let top = start.y;
        let right = start.x + start.w;
        let bottom = start.y + start.h;
        const snapEdge = (v: number, targets: number[], axis: "x" | "y") => {
          if (free) return v;
          const s = snapAxis([v], targets);
          if (s) {
            g.push({ axis, pos: s.guide });
            return v + s.delta;
          }
          return Math.round(v / GRID) * GRID;
        };
        if (mode.includes("w")) left = snapEdge(start.x + dx, xTargets, "x");
        if (mode.includes("e")) right = snapEdge(start.x + start.w + dx, xTargets, "x");
        if (mode.includes("n")) top = snapEdge(start.y + dy, yTargets, "y");
        if (mode.includes("s")) bottom = snapEdge(start.y + start.h + dy, yTargets, "y");
        left = clamp(left, 0, right - MIN);
        top = clamp(top, 0, bottom - MIN);
        right = clamp(right, left + MIN, STAGE_W);
        bottom = clamp(bottom, top + MIN, STAGE_H);
        r = { x: left, y: top, w: right - left, h: bottom - top };
      }
      last = r;
      setLive({ id: b.id, ...r });
      setGuides(g);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setLive(null);
      setGuides([]);
      if (moved) onFrame(b.id, last);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const hs = Math.max(14, 20 / (scale || 1));
  const sorted = [...page.blocks].sort((a, b) => a.z - b.z);

  return (
    <div ref={wrapRef} className="w-full">
      {width === 0 ? (
        <div style={{ aspectRatio: "16 / 9" }} />
      ) : (
        <div
          className="relative select-none overflow-hidden border-[3px] border-ink bg-white shadow-[8px_8px_0_0_var(--color-ink)]"
          style={{ width, height: stageFrameHeight(STAGE_H, scale, dpr) }}
          onPointerDown={() => onSelect(null)}
        >
          <div
            className="absolute left-0 top-0"
            style={
              {
                width: STAGE_W,
                height: STAGE_H,
                ...stageLayerStyle(scale),
                "--u": "1px",
                backgroundImage: "radial-gradient(circle, rgb(11 11 11 / 0.14) 2px, transparent 2.5px)",
                backgroundSize: "80px 80px",
                backgroundPosition: "0 0",
              } as CSSProperties
            }
          >
            {sorted.map((b) => {
              const r = rectOf(b);
              const sel = b.id === selectedId;
              return (
                <div
                  key={b.id}
                  className="absolute touch-none"
                  style={{ left: r.x, top: r.y, width: r.w, height: r.h, zIndex: b.z, cursor: "move" }}
                  onPointerDown={(e) => begin(e, b, "move")}
                  onDoubleClick={() => onOpenText(b.id)}
                >
                  <div className="pointer-events-none h-full w-full overflow-hidden">
                    <BlockView block={b} mode="design" />
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ outline: sel ? "4px solid var(--color-cobalt)" : undefined, outlineOffset: 2 }}
                  />
                </div>
              );
            })}

            {guides.map((g, i) => (
              <div
                key={i}
                className="pointer-events-none absolute bg-cobalt"
                style={g.axis === "x" ? { left: g.pos - 1, top: 0, width: 2, height: STAGE_H, zIndex: 2000 } : { top: g.pos - 1, left: 0, height: 2, width: STAGE_W, zIndex: 2000 }}
              />
            ))}

            {selectedId
              ? (() => {
                  const b = page.blocks.find((x) => x.id === selectedId);
                  if (!b) return null;
                  const r = rectOf(b);
                  return HANDLES.map((h) => (
                    <div
                      key={h.h}
                      className="absolute touch-none border-[3px] border-cobalt bg-white"
                      style={{ left: r.x + r.w * h.cx - hs / 2, top: r.y + r.h * h.cy - hs / 2, width: hs, height: hs, cursor: h.cursor, zIndex: 2001 }}
                      onPointerDown={(e) => begin(e, b, h.h)}
                    />
                  ));
                })()
              : null}
          </div>
        </div>
      )}
    </div>
  );
}
