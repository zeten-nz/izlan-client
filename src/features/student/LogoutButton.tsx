"use client";

import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { apiPost } from "@/lib/api";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await apiPost("/auth/logout", {});
        window.location.assign(ROUTES.login);
      }}
      className="label inline-flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap border-[3px] border-ink bg-white px-3 py-2 shadow-[3px_3px_0_0_var(--color-ink)] hover:bg-acid focus-visible:outline-[3px] focus-visible:outline-cobalt disabled:opacity-60"
    >
      {pending ? "Chiqilmoqda..." : "Chiqish"}
    </button>
  );
}
