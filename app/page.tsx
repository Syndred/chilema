import TimelineClient from "@/components/TimelineClient";
import { Suspense } from "react";

function HomeFallback() {
  return (
    <div className="min-h-dvh bg-[#FEE3E0]">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="text-lg font-semibold text-zinc-900">吃了吗</div>
          <div className="text-xs text-zinc-500">正在加载时间线…</div>
        </div>
      </header>
    </div>
  );
}

export default function Home() {
  // TimelineClient uses useSearchParams() and needs a Suspense boundary for SSG/build.
  return (
    <Suspense fallback={<HomeFallback />}>
      <TimelineClient />
    </Suspense>
  );
}
