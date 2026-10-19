"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { primaryBtn, smallBtn } from "@/features/notebook/ui";
import { cn } from "@/lib/cn";
import { fmtDateTime } from "./fmt";
import { gcall } from "./gapi";

type Gate = { gate: string; ruleId?: string; message: string };
type Preview = { ok: boolean; noChanges: boolean; snapshotHash: string; itemCount: number; errors: Gate[]; warnings: Gate[]; diff: { added: string[]; changed: string[]; removed: string[] }; impact: { ruleId: string; lessons: { id: string; title: string }[] }[] };
export type ReleaseRow = { id: string; seq: number; snapshotHash: string; note: string | null; createdAt: string; _count: { items: number } };
export type Activation = { seq: number; releaseId: string; action: string; actor: string; reason: string; previousReleaseId: string | null; createdAt: string };
export type Status = { active: { id: string; seq: number; snapshotHash: string; activatedAt: string; actor: string; reason: string } | null; overlayVersion: number };

/** Release nomzodlari. Admin nomzod yarata oladi; AKTIVLASHTIRISH production'da faqat deploy pipeline/CLI orqali (UI'da tugma yo'q). */
export function ReleasePanel({ status, releases, activations }: { status: Status; releases: ReleaseRow[]; activations: Activation[] }) {
  const router = useRouter();
  const [pv, setPv] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [note, setNote] = useState("");

  async function preview() {
    setBusy("pv");
    setMsg(null);
    const r = await gcall<Preview>("POST", "/admin/grammar/releases/preview", {});
    setBusy(null);
    if (r.ok) setPv(r.data);
    else setMsg({ tone: "err", text: r.message });
  }
  async function create() {
    setBusy("create");
    setMsg(null);
    const r = await gcall<{ releaseId: string; seq: number }>("POST", "/admin/grammar/releases/candidate", { note: note || undefined });
    setBusy(null);
    if (r.ok) {
      setMsg({ tone: "ok", text: `Nomzod yaratildi (#${r.data.seq}). Hali aktiv emas.` });
      router.refresh();
    } else setMsg({ tone: "err", text: r.message });
  }

  return (
    <div className="space-y-8">
      <section className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]" data-testid="active-release">
        <h2 className="display-cond text-2xl">Production holati</h2>
        {status.active ? (
          <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <dt className="label">Aktiv release</dt><dd>#{status.active.seq} <span className="font-mono text-sm">{status.active.id}</span></dd>
            <dt className="label">Xesh</dt><dd className="font-mono text-sm">{status.active.snapshotHash}</dd>
            <dt className="label">Aktivlashtirilgan</dt><dd>{fmtDateTime(status.active.activatedAt)}</dd>
            <dt className="label">Kim / sabab</dt><dd>{status.active.actor} — {status.active.reason}</dd>
            <dt className="label">Overlay versiyasi</dt><dd>{status.overlayVersion}</dd>
          </dl>
        ) : (
          <p className="mt-2" role="status">Aktiv release yo&apos;q: grammatika o&apos;quvchilarga ko&apos;rinmaydi (fail-closed).</p>
        )}
        <p className="mt-3 border-[3px] border-dashed border-ink p-3 text-sm">
          Aktivlashtirish va orqaga qaytarish faqat deploy pipeline / boshqariladigan CLI orqali bajariladi (UI orqali emas):
          <code className="mt-1 block break-all font-mono text-xs">node dist/grammar/cli.js activate --release &lt;id&gt; --expect-hash &lt;xesh&gt; --actor &lt;pipeline&gt; --reason &quot;…&quot; --backup-at &lt;ISO&gt;</code>
        </p>
      </section>

      <section className="border-[3px] border-ink bg-white p-4">
        <h2 className="display-cond text-2xl">Yangi release nomzodi</h2>
        <p className="mt-1 text-sm text-ink/70">Barcha TASDIQLANGAN (APPROVED) revisionlar darvozalardan o&apos;tkaziladi. Xato bo&apos;lsa nomzod yaratilmaydi.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button className={smallBtn} onClick={() => void preview()} disabled={busy !== null} data-testid="preview-release">Oldindan ko&apos;rish</button>
          <input aria-label="Izoh" className="min-h-10 min-w-[220px] flex-1 border-[3px] border-ink px-3" placeholder="Izoh (ixtiyoriy)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className={primaryBtn} onClick={() => void create()} disabled={busy !== null || (pv !== null && (!pv.ok || pv.noChanges))} data-testid="create-candidate">Nomzod yaratish</button>
        </div>
        {msg && <p role={msg.tone === "err" ? "alert" : "status"} className={cn("mt-3 border-[3px] border-ink p-3 font-bold", msg.tone === "ok" ? "bg-acid" : "bg-tomato/30")} data-testid="release-msg">{msg.text}</p>}
        {pv && (
          <div className="mt-4 space-y-3" data-testid="preview-result">
            <p className="font-bold">{pv.ok ? (pv.noChanges ? "Aktiv release bilan bir xil — o'zgarish yo'q" : `Tayyor: ${pv.itemCount} ta element`) : "Darvozadan o'tmadi"}</p>
            {pv.errors.length > 0 && <ul className="list-disc border-[3px] border-ink bg-tomato/30 p-3 pl-8">{pv.errors.map((e, i) => <li key={i}><code>{e.gate}</code> {e.ruleId} — {e.message}</li>)}</ul>}
            {pv.warnings.length > 0 && <ul className="list-disc border-[3px] border-ink bg-acid/40 p-3 pl-8">{pv.warnings.map((e, i) => <li key={i}><code>{e.gate}</code> {e.ruleId} — {e.message}</li>)}</ul>}
            <p className="text-sm">Qo&apos;shiladi: {pv.diff.added.length} · O&apos;zgaradi: {pv.diff.changed.length} · Olinadi: {pv.diff.removed.length}</p>
            {pv.impact.map((x) => <p key={x.ruleId} className="text-sm">Ta&apos;sir: {x.ruleId} → {x.lessons.map((l) => l.title).join(", ")}</p>)}
          </div>
        )}
      </section>

      <section className="border-[3px] border-ink bg-white p-4">
        <h2 className="display-cond text-2xl">Release&apos;lar</h2>
        <ul className="mt-2 space-y-2" data-testid="release-list">
          {releases.map((r) => (
            <li key={r.id} className={cn("border-[2px] border-ink/30 p-2", status.active?.id === r.id && "bg-acid/40")}>
              <span className="font-bold">#{r.seq}</span> · {r._count.items} element · {fmtDateTime(r.createdAt)} {status.active?.id === r.id && <b>· AKTIV</b>}
              <span className="block font-mono text-xs">{r.id} · {r.snapshotHash}</span>
              {r.note && <span className="block text-sm text-ink/70">{r.note}</span>}
            </li>
          ))}
          {releases.length === 0 && <li>Hali release yo&apos;q.</li>}
        </ul>
      </section>

      <section className="border-[3px] border-ink bg-white p-4">
        <h2 className="display-cond text-2xl">Aktivlashtirish tarixi</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {activations.map((a) => <li key={a.seq}>#{a.seq} {a.action} → <span className="font-mono">{a.releaseId.slice(0, 8)}</span> · {a.actor} · {a.reason} · {fmtDateTime(a.createdAt)}</li>)}
          {activations.length === 0 && <li>Bo&apos;sh.</li>}
        </ul>
      </section>
    </div>
  );
}
