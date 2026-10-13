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
      className="label border-[3px] border-ink bg-white px-3 py-2 shadow-[3px_3px_0_0_var(--color-ink)] hover:bg-acid disabled:opacity-60"
    >
      {pending ? "Chiqilmoqda..." : "Chiqish"}
    </button>
  );
}
