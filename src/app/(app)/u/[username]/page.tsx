import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicProfilePage } from "@/features/profile/pages";

export const metadata: Metadata = { title: "Profil", robots: { index: false } };

async function Content({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <PublicProfilePage username={username} />;
}

export default function Page({ params }: { params: Promise<{ username: string }> }) {
  return (
    <Suspense fallback={<div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>}>
      <Content params={params} />
    </Suspense>
  );
}
