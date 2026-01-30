import AddMealClient from "@/components/AddMealClient";
import { Suspense } from "react";

function AddMealPageFallback() {
  return (
    <div className="min-h-dvh bg-[#FEE3E0]">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-zinc-900">记录这一餐</div>
            <div className="text-xs text-zinc-500">正在准备…</div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default function AddMealPage() {
  // useSearchParams() in AddMealClient requires a Suspense boundary for SSG/build.
  return (
    <Suspense fallback={<AddMealPageFallback />}>
      <AddMealClient />
    </Suspense>
  );
}
