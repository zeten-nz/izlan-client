import { Fragment } from "react";
import { cn } from "@/lib/cn";

type Props = {
  items: readonly string[];
  className?: string;
  reverse?: boolean;
  separator?: string;
};

/** Cheksiz harakatlanuvchi lenta. Mazmun ikki marta chiziladi, CSS -50% ga suradi. */
export function Marquee({ items, className, reverse = false, separator = "✱" }: Props) {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <Fragment key={`${t}-${i}`}>
          <span className="px-6 whitespace-nowrap">{t}</span>
          <span className="px-2 text-[0.7em]">{separator}</span>
        </Fragment>
      ))}
    </div>
  );
  return (
    <div className={cn("flex overflow-hidden", className)}>
      <div className={cn("flex shrink-0", reverse ? "animate-marquee-rev" : "animate-marquee")}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
