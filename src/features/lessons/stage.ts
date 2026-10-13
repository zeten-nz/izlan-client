import { useSyncExternalStore, type CSSProperties } from "react";
import { STAGE_W } from "./types";

/** Sahna ramkasi (border-[3px] x 2): masshtab ramka ICHKI kengligiga qarab hisoblanadi. */
export const STAGE_FRAME = 6;

const subscribe = (cb: () => void) => {
  // brauzer zoomi ham `resize` yuboradi va devicePixelRatio'ni o'zgartiradi
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};

/** Brauzer zoomi/ekran zichligi (qurilma pikseli / CSS pikseli). */
export function useDevicePixelRatio(): number {
  return useSyncExternalStore(
    subscribe,
    () => window.devicePixelRatio || 1,
    () => 1,
  );
}

/**
 * Sahna masshtabi. Kenglikni QURILMA pikseliga butun qilib pastga yaxlitlaymiz, shunda sahnaning o'ng/pastki
 * chekkasi piksel to'riga tushadi (kasrli chekka — xira chiziqning sabablaridan biri).
 */
export function stageScale(outerWidth: number, dpr: number): number {
  const inner = Math.max(0, outerWidth - STAGE_FRAME);
  return Math.floor(inner * dpr) / dpr / STAGE_W;
}

/** Ramka balandligini ham qurilma pikseliga yaxlitlaydi. */
export function stageFrameHeight(stageHeight: number, scale: number, dpr: number): number {
  return Math.round(stageHeight * scale * dpr) / dpr + STAGE_FRAME;
}

/**
 * Sahna qatlamini masshtablaydi.
 *
 * `transform: scale(kasr)` brauzerda butun qatlamni kompozitor bilan kasrli masshtablab, matn va chegaralarni
 * qurilma piksellariga tushirmaydi (100% zoomda xira, ikki qavatli chiziqlar). CSS `zoom` esa layoutni brauzer
 * zoomi kabi o'zi hisoblaydi va chegaralar/qirralarni piksel to'riga yopishtiradi. Layout o'lchamlari bir xil
 * (sahna koordinatalari * masshtab), shuning uchun matn o'rami va ko'rinish o'zgarmaydi.
 * `zoom` yo'q brauzerlarda (Firefox < 126) eski transform yo'li qoladi.
 */
export function stageLayerStyle(scale: number): CSSProperties {
  if (typeof CSS !== "undefined" && CSS.supports("zoom", "0.5")) return { zoom: scale };
  return { transform: `scale(${scale})`, transformOrigin: "0 0" };
}
