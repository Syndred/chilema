"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Database, Plus, RefreshCw } from "lucide-react";
import DailySummary from "@/components/DailySummary";
import MealCard from "@/components/MealCard";
import { Button } from "@/components/ui/button";
import { listMealsDesc } from "@/lib/db/localDB";
import type { MealRecord } from "@/lib/types";

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmdLocal(ymd: string) {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatYmdLabel(ymd: string) {
  const dt = parseYmdLocal(ymd);
  return dt.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function TimelineClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlYmd = searchParams.get("date");

  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedYmd, setSelectedYmd] = useState(() => urlYmd ?? toYmd(new Date()));

  async function load() {
    try {
      setError(null);
      setLoading(true);
      const data = await listMealsDesc(200);
      setMeals(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  // Keep internal state in sync when URL changes (e.g. after saving a record).
  useEffect(() => {
    if (urlYmd && urlYmd !== selectedYmd) setSelectedYmd(urlYmd);
  }, [urlYmd, selectedYmd]);

  const dayMeals = useMemo(() => {
    const start = parseYmdLocal(selectedYmd);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const startMs = start.getTime();
    const endMs = end.getTime();
    return meals.filter((m) => m.timestamp >= startMs && m.timestamp < endMs);
  }, [meals, selectedYmd]);

  const dayCount = dayMeals.length;
  const isToday = selectedYmd === toYmd(new Date());

  return (
    <div className="min-h-dvh bg-[#FEE3E0]">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-zinc-900">吃了吗</div>
            <div className="mt-0.5 text-xs text-zinc-500">
              {loading
                ? "正在翻看记录…"
                : `${isToday ? "今天" : formatYmdLabel(selectedYmd)} 吃了 ${dayCount} 餐`}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                type="date"
                value={selectedYmd}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedYmd(v);
                  router.replace(`/?date=${encodeURIComponent(v)}`);
                }}
                className="h-9 rounded-full border bg-white px-3 text-sm text-zinc-800 shadow-sm outline-none focus:ring-2 focus:ring-[#FF9A8B]/40"
                aria-label="选择日期"
              />
              {!isToday ? (
                <Button
                  variant="outline"
                  className="h-9 rounded-full"
                  onClick={() => {
                    const today = toYmd(new Date());
                    setSelectedYmd(today);
                    router.replace(`/?date=${encodeURIComponent(today)}`);
                  }}
                >
                  回到今天
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => void load()}
              aria-label="刷新"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button
              asChild
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="数据与存储"
            >
              <Link href="/storage">
                <Database className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              className="rounded-full"
            >
              <Link href={`/add?date=${encodeURIComponent(selectedYmd)}`}>
                <Plus className="h-4 w-4" />
                记录这一餐
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {!loading ? (
          <DailySummary
            meals={meals}
            todayMeals={dayMeals}
          />
        ) : null}

        {error ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-red-600">{error}</div>
        ) : null}

        {loading ? (
          <div className="mt-6 text-center text-sm text-zinc-600">加载中…</div>
        ) : meals.length === 0 ? (
          <div className="mt-10 rounded-3xl border bg-white/70 p-8 text-center">
            <div className="text-lg font-semibold text-zinc-900">还没有记录</div>
            <div className="mt-2 text-sm text-zinc-600">从第一餐开始，把生活温柔地存起来。</div>
            <Button
              asChild
              className="mt-5 rounded-full"
            >
              <Link href={`/add?date=${encodeURIComponent(selectedYmd)}`}>记录这一餐</Link>
            </Button>
          </div>
        ) : dayMeals.length === 0 ? (
          <div className="mt-10 rounded-3xl border bg-white/70 p-8 text-center">
            <div className="text-lg font-semibold text-zinc-900">这一天还没有记录</div>
            <div className="mt-2 text-sm text-zinc-600">换个日期看看，或者从下一餐开始记录。</div>
            <Button
              asChild
              className="mt-5 rounded-full"
            >
              <Link href={`/add?date=${encodeURIComponent(selectedYmd)}`}>记录这一餐</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {dayMeals.map((m) => (
              <MealCard
                key={m.id}
                record={m}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
