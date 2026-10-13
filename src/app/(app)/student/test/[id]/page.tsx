import type { Metadata } from "next";
import { Suspense } from "react";
import { PlacementRunner } from "@/features/student/components/PlacementRunner";

export const metadata: Metadata = { title: "Daraja testi", robots: { index: false } };

async function Runner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlacementRunner id={id} />;
}

export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>}>
      <Runner params={params} />
    </Suspense>
  );
}
