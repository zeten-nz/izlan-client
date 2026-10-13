import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** Tushuntirish matni: "- " bilan boshlangan qatorlar ro'yxat, **...** qalin. */
export function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="mt-2 space-y-1.5 pl-1">
          {list.map((li, i) => (
            <li key={i} className="flex gap-2.5">
              <span aria-hidden className="mt-[0.55em] size-2 shrink-0 bg-ink" />
              <span>{inline(li)}</span>
            </li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const line of lines) {
    if (line.startsWith("- ")) list.push(line.slice(2));
    else {
      flush();
      if (line.trim()) blocks.push(<p key={`p-${blocks.length}`} className="mt-2 first:mt-0">{inline(line)}</p>);
    }
  }
  flush();
  return <>{blocks}</>;
}
