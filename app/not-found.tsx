import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-[#FEE3E0] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border bg-white/70 p-6 text-center">
        <div className="text-lg font-semibold text-zinc-900">走丢啦</div>
        <div className="mt-2 text-sm text-zinc-600">
          这个页面可能不存在，或者已经被移动了。
        </div>

        <Button asChild className="mt-5 rounded-full">
          <Link href="/">回到时间线</Link>
        </Button>

        <div className="mt-4 text-xs text-zinc-500">
          小提示：你的数据都在本地，不会丢。
        </div>
      </div>
    </div>
  );
}
