// Grammatika ma'lumoti manbasi: BITTA qiymat tanlanadi (GRAMMAR_SOURCE), ikkalasi parallel o'qilmaydi.
//   static  — build'dagi src/generated/grammar-public.json (o'tish davri, cutover'gacha; standart)
//   release — PostgreSQL'dagi aktiv release (server ichki API orqali) + kill-switch overlay
// Faqat server tomonidan (komponent/proxy) ishlating.
import raw from "../../generated/grammar-public.json";
import { publicDataSchema, type PublicData } from "./public-data.ts";
import { createStore, type GrammarStore } from "./store.ts";

export class GrammarUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrammarUnavailableError";
  }
}

const SOURCE: "static" | "release" = process.env.GRAMMAR_SOURCE === "release" ? "release" : "static";
const MAX_TTL_MS = 30_000; // kill-switch talabi: overlay/aktiv ko'rsatkich TTL'i 30 s dan oshmaydi
const clampTtl = (v: string | undefined, d: number) => Math.min(MAX_TTL_MS, Math.max(0, Number(v ?? d) || d));
const ACTIVE_TTL_MS = clampTtl(process.env.GRAMMAR_ACTIVE_TTL_MS, 15_000);
const OVERLAY_TTL_MS = clampTtl(process.env.GRAMMAR_OVERLAY_TTL_MS, 15_000);
const FETCH_TIMEOUT_MS = 2_500;

const API = process.env.GRAMMAR_API_URL ?? process.env.API_URL ?? "http://127.0.0.1:4000";
const TOKEN = process.env.GRAMMAR_INTERNAL_TOKEN ?? "";

type Active = { releaseId: string; seq: number; snapshotHash: string; contentSchemaVersion: number };
type Overlay = { overlayVersion: number; hiddenIds: string[] };
type Memo<T> = { value: T; at: number };

let staticStore: GrammarStore | null = null;
let active: Memo<Active> | null = null;
let overlay: Memo<Overlay> | null = null;
const bundles = new Map<string, PublicData>(); // releaseId → immutable bundle (kichik LRU)
let composed: { key: string; store: GrammarStore } | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  if (!TOKEN) throw new GrammarUnavailableError("GRAMMAR_INTERNAL_TOKEN sozlanmagan");
  let res: Response;
  try {
    res = await fetch(`${API}/api/internal/grammar${path}`, {
      headers: { "x-grammar-internal": TOKEN },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new GrammarUnavailableError("Grammatika xizmatiga ulanib bo'lmadi");
  }
  if (!res.ok) throw new GrammarUnavailableError(`Grammatika xizmati xatosi: ${res.status}`);
  return (await res.json()) as T;
}

/**
 * TTL ichida xotiradagi qiymat ishlatiladi. Yangilab bo'lmasa: eski qiymat faqat TTL CHEGARASIGACHA (stale-if-error cheklangan);
 * undan keyin FAIL-CLOSED (GrammarUnavailableError): yashirilgan kontent oshkor bo'lmaydi.
 */
// performance.now(): Date.now() cacheComponents prerender'ida "unstable value" xatosini beradi; TTL uchun monoton soat yetarli.
async function refresh<T>(memo: Memo<T> | null, ttl: number, load: () => Promise<T>): Promise<Memo<T>> {
  const now = performance.now();
  if (memo && now - memo.at < ttl) return memo;
  try {
    return { value: await load(), at: performance.now() };
  } catch (e) {
    if (memo && now - memo.at < MAX_TTL_MS) return memo;
    throw e;
  }
}

export async function getGrammar(): Promise<GrammarStore> {
  if (SOURCE === "static") return (staticStore ??= createStore(publicDataSchema.parse(raw)));

  active = await refresh(active, ACTIVE_TTL_MS, () => fetchJson<Active>("/active"));
  overlay = await refresh(overlay, OVERLAY_TTL_MS, () => fetchJson<Overlay>("/overlay"));
  const { releaseId } = active.value;
  const key = `${releaseId}:${overlay.value.overlayVersion}`;
  if (composed?.key === key) return composed.store;

  let bundle = bundles.get(releaseId);
  if (!bundle) {
    bundle = publicDataSchema.parse(await fetchJson<unknown>(`/releases/${encodeURIComponent(releaseId)}/bundle`));
    bundles.set(releaseId, bundle);
    if (bundles.size > 3) bundles.delete(bundles.keys().next().value as string);
  }
  const hidden = new Set(overlay.value.hiddenIds);
  const data: PublicData = hidden.size
    ? {
        ...bundle,
        rules: bundle.rules.filter((r) => !hidden.has(r.id)),
        redirects: bundle.redirects.filter((r) => !hidden.has(r.id)),
      }
    : bundle;
  const store = createStore(data);
  composed = { key, store };
  return store;
}

/** Test/diagnostika: ichki keshni tozalash. */
export function resetGrammarCache(): void {
  staticStore = null;
  active = null;
  overlay = null;
  bundles.clear();
  composed = null;
}
