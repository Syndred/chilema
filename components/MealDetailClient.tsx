"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteMeal, getMeal } from "@/lib/db/localDB";
import type { MealRecord } from "@/lib/types";
import { mealTypeToLabel } from "@/lib/utils/mealType";

function formatTimeFull(ts: number) {
  return new Date(ts).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MealDetailClient({ id }: { id: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<MealRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        setLoading(true);
        const res = await getMeal(id);
        if (cancelled) return;
        setRecord(res ?? null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-dvh bg-[#FEE3E0]">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-zinc-900">这一餐</div>
          <div className="flex items-center gap-2">
            {record ? (
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full"
                aria-label="删除这条记录"
                disabled={deleting}
                onClick={() => {
                  const ok = window.confirm(
                    "确定要删除这条记录吗？\n此操作不可撤销。",
                  );
                  if (!ok) return;

                  setDeleting(true);
                  void (async () => {
                    try {
                      await deleteMeal(id);
                      router.push("/");
                      router.refresh();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "删除失败");
                    } finally {
                      setDeleting(false);
                    }
                  })();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}

            <Button asChild variant="outline" className="rounded-full">
              <Link href="/">返回</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {loading ? (
          <div className="mt-6 text-center text-sm text-zinc-600">加载中…</div>
        ) : error ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-red-600">
            {error}
          </div>
        ) : !record ? (
          <div className="rounded-3xl border bg-white/70 p-8 text-center">
            <div className="text-lg font-semibold text-zinc-900">找不到这条记录</div>
            <div className="mt-2 text-sm text-zinc-600">
              可能已被清理，或链接不完整。
            </div>
            <Button asChild className="mt-5 rounded-full">
              <Link href="/">回到时间线</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-3xl border bg-white/70 overflow-hidden">
            {record.image ? (
              <div className="relative w-full aspect-square bg-zinc-100">
                <Image
                  src={record.image}
                  alt={record.text ?? mealTypeToLabel(record.mealType)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gradient-to-br from-[#FEE3E0] to-white" />
            )}

            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-semibold text-zinc-900">
                  {mealTypeToLabel(record.mealType)}
                </div>
                <div className="text-xs text-zinc-500">
                  {formatTimeFull(record.timestamp)}
                </div>
              </div>

              {record.text ? (
                <div className="mt-3 whitespace-pre-wrap break-words text-sm text-zinc-700">
                  {record.text}
                </div>
              ) : (
                <div className="mt-3 text-sm text-zinc-500">（没有文字）</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
