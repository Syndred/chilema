"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep it minimal; avoid leaking details in UI, but log for dev.
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-[#FEE3E0] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border bg-white/70 p-6 text-center">
        <div className="text-lg font-semibold text-zinc-900">出了点小状况</div>
        <div className="mt-2 text-sm text-zinc-600">
          别担心，你的数据仍然在本地。你可以重试或回到首页。
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <Button className="rounded-full" onClick={() => reset()}>
            再试一次
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">回到首页</Link>
          </Button>
        </div>

        <div className="mt-4 text-xs text-zinc-500">
          {error.digest ? `错误标识：${error.digest}` : null}
        </div>
      </div>
    </div>
  );
}
