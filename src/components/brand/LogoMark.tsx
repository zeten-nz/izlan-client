/**
 * Izlan belgisi — lupa (manba: D:\izlan-ads\brand\logo\izlan-logo-C-ilens.svg dagi lupa, public/brand/logo-lens.svg).
 * Favicon va app ikonkalari ham shu belgidan yasalgan (src/app/icon.png, apple-icon.png).
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- statik SVG
    <img src="/brand/logo-lens.svg" alt={title ?? ""} aria-hidden={title ? undefined : true} width={64} height={64} className={className} />
  );
}
