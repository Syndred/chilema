import type { MealType } from "@/lib/types";

/**
 * Auto detect meal type by local time.
 * 早餐(6-11), 午餐(11-15), 晚餐(15-21), 其余：加餐
 */
export function detectMealTypeByTime(date: Date = new Date()): MealType {
  const h = date.getHours();
  if (h >= 6 && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 21) return "dinner";
  return "snack";
}

export function mealTypeToLabel(mealType: MealType): string {
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
