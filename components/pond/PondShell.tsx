"use client";

import dynamic from "next/dynamic";

const PondScreen = dynamic(
  () => import("@/components/pond/PondScreen").then((mod) => mod.PondScreen),
  {
    ssr: false,
    loading: () => <div className="h-dvh bg-water-1" aria-hidden />,
  },
);

export function PondShell() {
  return <PondScreen initial={null} />;
}
