import { Fragment, type ReactNode } from "react";
import { parseMarkdown, type Block, type Inline, type Tone } from "@/lib/grammar/markdown";
import { cn } from "@/lib/cn";

const TONE: Record<Tone, { label: string; box: string }> = {
  info: { label: "Eslatma", box: "bg-sky" },
  warning: { label: "Diqqat", box: "bg-tomato" },
  tip: { label: "Maslahat", box: "bg-acid" },
};

function Inlines({ nodes }: { nodes: Inline[] }): ReactNode {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return <Fragment key={i}>{n.v}</Fragment>;
      case "strong":
        return <strong key={i}><Inlines nodes={n.c} /></strong>;
      case "em":
        return <em key={i}><Inlines nodes={n.c} /></em>;
      case "code":
        return <code key={i} className="bg-paper-2 px-1.5 py-0.5 font-mono text-[0.9em]">{n.v}</code>;
      case "link": {
        const external = n.href.startsWith("https://");
        return (
          <a
            key={i}
            href={n.href}
            className="font-bold underline decoration-[3px] decoration-acid underline-offset-4 hover:bg-acid"
            {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}
          >
            <Inlines nodes={n.c} />
          </a>
        );
      }
    }
  });
}

function Blocks({ blocks }: { blocks: Block[] }): ReactNode {
  return blocks.map((b, i) => {
    switch (b.t) {
      case "h2":
        return <h3 key={i} className="display-cond mt-8 text-[clamp(24px,3.4vw,34px)] first:mt-0"><Inlines nodes={b.c} /></h3>;
      case "h3":
        return <h4 key={i} className="label mt-6 text-[13px] first:mt-0"><Inlines nodes={b.c} /></h4>;
      case "p":
        return <p key={i} className="mt-3 first:mt-0"><Inlines nodes={b.c} /></p>;
      case "ul":
      case "ol": {
        const Tag = b.t;
        return (
          <Tag key={i} className={cn("mt-3 space-y-2 pl-6", b.t === "ul" ? "list-disc marker:text-ink" : "list-decimal")}>
            {b.items.map((it, j) => (
              <li key={j}><Inlines nodes={it} /></li>
            ))}
          </Tag>
        );
      }
      case "callout": {
        const tone = TONE[b.tone];
        return (
          <aside key={i} className={cn("mt-5 border-[3px] border-ink p-4 shadow-[4px_4px_0_0_var(--color-ink)]", tone.box)}>
            <p className="label mb-1.5">{tone.label}</p>
            <Blocks blocks={b.c} />
          </aside>
        );
      }
      case "code":
        return <pre key={i} className="mt-3 overflow-x-auto border-[3px] border-ink bg-white p-3 font-mono text-sm">{b.v}</pre>;
    }
  });
}

/**
 * MDX tanasining xavfsiz qism to'plami. Kod bajarilmaydi: matn → AST → React elementlari
 * (React matnni o'zi escape qiladi). Xavfli havolalar parser'da olib tashlanadi.
 */
export function SafeMarkdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn("max-w-prose text-lg leading-relaxed", className)}>
      <Blocks blocks={parseMarkdown(source)} />
    </div>
  );
}
