"use client";

import { useEffect, useState } from "react";
import { apiGetJson, apiSend } from "@/lib/api";
import { cn } from "@/lib/cn";
import { LoadState, smallBtn } from "@/features/notebook/ui";
import { BadgeArt } from "./badges";

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string;
  active: boolean;
  holders: number;
  rule: { metric: string; target: number; requirement: string } | null;
};

const METRIC: Record<string, string> = {
  completedLessons: "Yakunlangan darslar",
  completedTopics: "Yakunlangan mavzular",
  quiz90Topics: "90%+ test natijali mavzular",
  activeDays: "Faol kunlar (Asia/Tashkent)",
};

/** Admin: achievement ro'yxati, qoidalar (faqat ko'rish) va faollik. Qoidani admin tahrirlay olmaydi. */
export function AchievementsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [version, setVersion] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  function load() {
    return apiGetJson<{ ruleVersion: string; items: Row[] }>("/admin/achievements").then((r) => {
      if (r.ok) {
        setRows(r.data.items);
        setVersion(r.data.ruleVersion);
        setStatus("ready");
      } else {
        setError(r.message);
        setStatus("error");
      }
    });
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggle(r: Row) {
    setBusy(r.id);
    setMsg("");
    const res = await apiSend("PATCH", `/admin/achievements/${r.id}`, { active: !r.active });
    setBusy(null);
    if (res.ok) await load();
    else setMsg(res.message);
  }

  return (
    <div>
      <LoadState
        status={status}
        error={error}
        onRetry={() => {
          setStatus("loading");
          void load();
        }}
      />
      {status === "ready" && (
        <>
          <p className="label">Qoidalar versiyasi: {version}</p>
          {msg && (
            <p role="alert" className="label mt-3 border-2 border-ink bg-tomato px-2 py-1 text-paper">
              {msg}
            </p>
          )}
          <ul className="mt-4 space-y-3">
            {rows.map((r) => (
              <li key={r.id} className={cn("flex flex-wrap items-center gap-4 border-[3px] border-ink p-4", r.active ? "bg-white" : "bg-paper-2")}>
                <BadgeArt slug={r.slug} locked={!r.active} className="size-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-black [overflow-wrap:anywhere]">{r.name}</p>
                  <p className="text-sm text-ink/75 [overflow-wrap:anywhere]">{r.description}</p>
                  {r.rule ? (
                    <p className="label mt-1 [overflow-wrap:anywhere]">
                      {r.rule.requirement} · {METRIC[r.rule.metric] ?? r.rule.metric} ≥ {r.rule.target}
                    </p>
                  ) : (
                    <p className="label mt-1">Qoida yo&apos;q</p>
                  )}
                  <p className="label mt-1 text-[11px]">Egalari: {r.holders}</p>
                </div>
                <button type="button" className={smallBtn} disabled={busy === r.id} onClick={() => toggle(r)} aria-pressed={r.active}>
                  {r.active ? "Faol — to'xtatish" : "Nofaol — yoqish"}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink/70">
            Achievement shartlari serverda boshqariladi va bu yerda tahrirlanmaydi. To&apos;xtatilsa, yangi badge berilmaydi; olinganlari qoladi.
          </p>
        </>
      )}
    </div>
  );
}
