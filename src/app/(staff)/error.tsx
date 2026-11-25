"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/** Ustoz/admin qismi uchun xato chegarasi. */
export default function SegmentError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorState error={error} retry={retry} homeHref="/" homeLabel="Bosh sahifa" />;
}
