import { LogoMark } from "@/components/brand/LogoMark";

/** Sahifalar orasidagi yengil yuklanish holati (app/loading.tsx shundan foydalanadi). */
export function RouteLoading() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Yuklanmoqda">
      <LogoMark className="size-14 animate-spin border-[3px] border-ink [animation-duration:1.6s]" />
    </div>
  );
}
