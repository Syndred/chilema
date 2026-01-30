export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealTypeLabel = "早餐" | "午餐" | "晚餐" | "加餐";

export interface MealRecord {
  id: string; // UUID
  timestamp: number; // Unix ms
  mealType: MealType;
  image?: string; // base64 (prefer compressed)
  text?: string;
}

export function createMealRecordId() {
  // modern browsers + secure contexts
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // fallback
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
