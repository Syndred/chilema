"use client";

import { useMemo } from "react";
import type { MealRecord, MealType } from "@/lib/types";
import { mealTypeToLabel } from "@/lib/utils/mealType";

const MILESTONES = [10, 50, 100];

function getWeekdayCN(d: Date) {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()]!;
}

function findSimpleInsight(meals: MealRecord[]): string | null {
  // Very small heuristic: detect repeated "面/面条/拉面/粉" on the same weekday.
  const keywordGroups: Array<{ key: string; regex: RegExp; label: string }> = [
    { key: "noodles", regex: /(面条|拉面|面食|拌面|汤面|米线|粉)/, label: "面食" },
    { key: "rice", regex: /(米饭|盖饭|炒饭|寿司)/, label: "米饭" },
    { key: "coffee", regex: /(咖啡|拿铁|美式)/, label: "咖啡" },
  ];

  const hits = meals
    .map((m) => {
      const text = (m.text ?? "").trim();
      if (!text) return null;
      const group = keywordGroups.find((g) => g.regex.test(text));
      if (!group) return null;
      const wd = new Date(m.timestamp);
      return { label: group.label, weekday: getWeekdayCN(wd) };
    })
    .filter(Boolean) as Array<{ label: string; weekday: string }>;

  if (hits.length < 2) return null;

  const counter = new Map<string, number>();
  for (const h of hits) {
    const k = `${h.weekday}-${h.label}`;
    counter.set(k, (counter.get(k) ?? 0) + 1);
  }

  let best: { k: string; n: number } | null = null;
  for (const [k, n] of counter) {
    if (!best || n > best.n) best = { k, n };
  }

  if (!best || best.n < 2) return null;
  const [weekday, label] = best.k.split("-");
  return `发现你 ${weekday} 常吃${label}`;
}

function mealTypeOfRecord(m: MealRecord): MealType {
  return m.mealType;
}

export default function DailySummary({
  meals,
  todayMeals,
}: {
  meals: MealRecord[];
  todayMeals: MealRecord[];
}) {
  const { summary, insight, milestone } = useMemo(() => {
    const todayCount = todayMeals.length;

    // summary text
    let summary = "";
    if (todayCount === 0) {
      summary = "今天还没有记录，先从一餐开始吧。";
    } else {
      const breakfast = todayMeals
        .filter((m) => mealTypeOfRecord(m) === "breakfast")
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      if (breakfast) {
        const h = new Date(breakfast.timestamp).getHours();
        summary = `今天吃了 ${todayCount} 餐，早餐${
          h <= 9 ? "很准时呢！" : h <= 11 ? "也不错～" : "有点晚啦～"
        }`;
      } else {
        summary = `今天吃了 ${todayCount} 餐，记得也照顾下早餐哦～`;
      }
    }

    // insight (based on recent text)
    const recent = meals.slice(0, 80); // Timeline is desc; still ok for heuristics
    const insight = findSimpleInsight(recent);

    // milestone
    const total = meals.length;
    const hit = MILESTONES.includes(total) ? total : null;

    return { summary, insight, milestone: hit };
  }, [meals, todayMeals]);

  const todayTypes = useMemo(() => {
    const map = new Map<MealType, number>();
    for (const m of todayMeals) {
      const t = mealTypeOfRecord(m);
      map.set(t, (map.get(t) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort(
      (a, b) => (a[0] > b[0] ? 1 : -1),
    );
  }, [todayMeals]);

  return (
    <section className="mb-4 space-y-3">
      <div className="rounded-3xl border bg-white/70 p-4">
        <div className="text-sm font-medium text-zinc-900">{summary}</div>

        {todayTypes.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {todayTypes.map(([t, n]) => (
              <div
                key={t}
                className="rounded-full border bg-white px-3 py-1 text-xs text-zinc-700"
              >
                {mealTypeToLabel(t)} {n}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {insight ? (
        <div className="rounded-3xl border bg-white/70 p-4">
          <div className="text-xs text-zinc-500">智能洞察</div>
          <div className="mt-1 text-sm font-medium text-zinc-900">{insight}</div>
        </div>
      ) : null}

      {milestone ? (
        <div className="rounded-3xl border bg-white/70 p-4">
          <div className="text-xs text-zinc-500">里程碑</div>
          <div className="mt-1 text-sm font-semibold text-zinc-900">
            第 {milestone} 餐，记录坚持得很棒。
          </div>
        </div>
      ) : null}
    </section>
  );
}
