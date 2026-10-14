import Link from "next/link";
import { cn } from "@/lib/cn";

const ITEMS = [
  { id: "teachers", label: "Ustoz qo'shish", href: "/admin" },
  { id: "catalog", label: "Ta'lim tuzilmasi", href: "/admin/catalog" },
  { id: "cosmetics", label: "Bezaklar", href: "/admin/cosmetics" },
] as const;

/** Admin bo'limlari orasida o'tish (mavjud neo-brutalist tugmalar uslubida). */
export function AdminNav({ active }: { active: (typeof ITEMS)[number]["id"] }) {
  return (
    <nav aria-label="Admin bo'limlari" className="mb-6 flex flex-wrap gap-2">
      {ITEMS.map((i) => (
        <Link
          key={i.id}
          href={i.href}
          aria-current={i.id === active ? "page" : undefined}
          className={cn(
            "label border-[3px] border-ink px-3 py-2",
            i.id === active ? "bg-ink text-paper shadow-[3px_3px_0_0_var(--color-acid)]" : "bg-white hover:bg-acid",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
