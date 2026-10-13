"use client";

import type { ReactNode } from "react";
import { ONBOARDING_EVENT, type OnboardingRequest } from "./OnboardingHost";

/** Yo'nalish/daraja oynasini istalgan joydan ochuvchi tugma. */
export function OnboardingTrigger({ request, className, children }: { request: OnboardingRequest; className?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent(ONBOARDING_EVENT, { detail: request }))}>
      {children}
    </button>
  );
}
