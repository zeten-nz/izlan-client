import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";

/** Huquqiy hujjatlar: marketing qobig'i, lekin landing'ning canonical/JSON-LD sozlamalarisiz. */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
