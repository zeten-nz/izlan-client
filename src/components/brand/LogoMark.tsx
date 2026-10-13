import type { SVGProps } from "react";

/**
 * Izlan belgisi: qora kvadrat ichida "i" harfi.
 * Nuqta = linza/nishon (izlanish), tanasi = yuqoriga yo‘l.
 */
export function LogoMark({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      <rect width="64" height="64" fill="#0b0b0b" />
      <circle cx="32" cy="17" r="10" fill="#d6ff3d" />
      <circle cx="32" cy="17" r="10" fill="none" stroke="#0b0b0b" strokeWidth="2" />
      <circle cx="32" cy="17" r="3.4" fill="#0b0b0b" />
      <rect x="23" y="33" width="18" height="23" fill="#f1eee4" />
      <rect x="23" y="49" width="18" height="7" fill="#ff4a22" />
    </svg>
  );
}
