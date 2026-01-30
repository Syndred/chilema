import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { MealRecord, MealType } from "@/lib/types";

function mealTypeToLabel(mealType: MealType) {
  switch (mealType) {
    case "breakfast":
      return "早餐";
    case "lunch":
      return "午餐";
    case "dinner":
      return "晚餐";
    case "snack":
      return "加餐";
  }
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MealCard({ record }: { record: MealRecord }) {
  return (
    <Link
      href={`/meal/${record.id}`}
      className="block h-full"
    >
      <Card className="h-full overflow-hidden border-zinc-200 bg-white transition hover:shadow-sm flex flex-col">
        {record.image ? (
          // base64
          <div className="relative w-full aspect-square bg-zinc-100">
            <Image
              src={record.image}
              alt={record.text ?? mealTypeToLabel(record.mealType)}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
            />
          </div>
        ) : (
          <div className="w-full aspect-square bg-gradient-to-br from-[#FEE3E0] to-white" />
        )}

        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-zinc-900">
              {mealTypeToLabel(record.mealType)}
            </div>
            <div className="text-xs text-zinc-500">{formatTime(record.timestamp)}</div>
          </div>

          {/* Keep a consistent height for all cards (reserve 2 lines) */}
          <div className="mt-2 text-sm text-zinc-700 line-clamp-2 min-h-[2.5rem]">
            {record.text ? record.text : <span className="invisible">占位</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
