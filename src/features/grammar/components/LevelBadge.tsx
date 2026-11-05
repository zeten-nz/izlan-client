import { cn } from "@/lib/cn";

/** Daraja: tasdiqlanmagan bo'lsa "taxminiy" deb ko'rsatiladi (qat'iy fakt sifatida emas). */
export function LevelBadge({
  system,
  value,
  confirmed,
  className,
}: {
  system?: string;
  value: string;
  confirmed?: boolean;
  className?: string;
}) {
  const label = system ? `${system.toUpperCase()} · ${value}` : value;
  return (
    <span
      className={cn("label shrink-0 border-[3px] border-ink bg-acid px-2 py-0.5", !confirmed && "border-dashed", className)}
      title={confirmed ? undefined : "Taxminiy daraja: hali metodist tomonidan tasdiqlanmagan"}
    >
      {confirmed ? label : `≈ ${label}`}
      {!confirmed && <span className="sr-only"> (taxminiy)</span>}
    </span>
  );
}
