"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { BlockView, type OnAnswer } from "./blocks/BlockView";
import { u } from "./blocks/units";
import { stageFrameHeight, stageLayerStyle, stageScale, useDevicePixelRatio } from "./stage";
import { STAGE_H, STAGE_W, type AttemptView, type Block, type PlayerBlock } from "./types";

/** Shu kenglikdan tor bo'lsa sahna o'rniga ustun (reflow) ko'rinishi: telefonda matn o'qiladigan bo'lib qoladi. */
const REFLOW_BELOW = 720;
const REFLOW_UNIT = 0.5;

export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

type Props = {
  blocks: (Block | PlayerBlock)[];
  mode: "design" | "play";
  attempts?: Record<string, AttemptView>;
  onAnswer?: OnAnswer;
};

/** Sahifani ko'rsatadi: keng ekranda 16:9 sahna (masshtablanadi), tor ekranda ustun. */
export function PageView({ blocks, mode, attempts, onAnswer }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const reflow = mode === "play" && width > 0 && width < REFLOW_BELOW;
  const dpr = useDevicePixelRatio();
  const scale = stageScale(width, dpr);

  return (
    <div ref={ref} className="w-full">
      {width === 0 ? (
        <div style={{ aspectRatio: "16 / 9" }} />
      ) : reflow ? (
        <div className="flex flex-col gap-5" style={{ "--u": `${REFLOW_UNIT}px` } as CSSProperties}>
          {[...blocks]
            .sort((a, b) => a.y - b.y || a.x - b.x)
            .map((b) => (
              <div key={b.id} style={b.type === "image" ? { aspectRatio: `${b.w} / ${b.h}` } : b.type === "audio" ? { minHeight: u(90) } : undefined}>
                <BlockView block={b} mode={mode} attempt={attempts?.[b.id]} onAnswer={onAnswer} />
              </div>
            ))}
        </div>
      ) : (
        <div
          className="relative overflow-hidden border-[3px] border-ink bg-white"
          style={{ width, height: stageFrameHeight(STAGE_H, scale, dpr) }}
        >
          <div
            className="absolute left-0 top-0"
            style={{ width: STAGE_W, height: STAGE_H, ...stageLayerStyle(scale), "--u": "1px" } as CSSProperties}
          >
            {blocks.map((b) => (
              <div key={b.id} className="absolute" style={{ left: b.x, top: b.y, width: b.w, height: b.h, zIndex: b.z }}>
                <BlockView block={b} mode={mode} attempt={attempts?.[b.id]} onAnswer={onAnswer} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
