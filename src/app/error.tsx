"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/** Ildiz darajadagi xato chegarasi (marketing va auth sahifalari). */
export default function SegmentError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorState error={error} retry={retry} homeHref="/" homeLabel="Bosh sahifa" />;
}
