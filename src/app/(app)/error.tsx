"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/** Talaba qismi uchun xato chegarasi: header va pastki navigatsiya saqlanadi. */
export default function SegmentError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorState error={error} retry={retry} homeHref="/student" homeLabel="Asosiy sahifa" />;
}
