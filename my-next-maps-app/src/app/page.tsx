'use client';

import dynamic from "next/dynamic";

const AppUI = dynamic(() => import("../components/AppUI"), { ssr: false });

export default function HomePage() {
  return <AppUI />;
}
