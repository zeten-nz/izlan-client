"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** @username — bosilganda nusxalanadi (profil havolasini ulashish uchun qulay). */
export function CopyUsername({ username, className }: { username: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(`@${username}`);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = `@${username}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <button
      type="button"
      onClick={copy}
      title="Nusxalash"
      aria-label={`@${username} — nusxalash`}
      className={cn(
        "group inline-flex items-center gap-1.5 border-2 border-transparent px-1 py-0.5 font-mono text-sm text-ink/70 transition hover:border-ink hover:bg-acid hover:text-ink focus-visible:outline-[3px] focus-visible:outline-cobalt",
        copied && "border-ink bg-acid text-ink",
        className,
      )}
    >
      @{username}
      <span aria-hidden className="label text-[10px]">{copied ? "✓ nusxalandi" : "⧉"}</span>
      <span className="sr-only" role="status">{copied ? "Nusxalandi" : ""}</span>
    </button>
  );
}
