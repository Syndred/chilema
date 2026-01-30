import type { MealRecord } from "@/lib/types";

const DB_NAME = "chilema";
const DB_VERSION = 1;

const STORE_MEALS = "meals";

interface LocalDB {
  db: IDBDatabase;
}

let dbPromise: Promise<LocalDB> | null = null;

function openDB(): Promise<LocalDB> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in the browser"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_MEALS)) {
        const store = db.createObjectStore(STORE_MEALS, { keyPath: "id" });
        store.createIndex("by_timestamp", "timestamp");
      }
    };

    request.onsuccess = () => resolve({ db: request.result });
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });

  return dbPromise;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction error"));
  });
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request error"));
  });
}

export async function addMeal(record: MealRecord): Promise<void> {
  const { db } = await openDB();
  const tx = db.transaction(STORE_MEALS, "readwrite");
  tx.objectStore(STORE_MEALS).put(record);
  await txDone(tx);
}

export async function deleteMeal(id: string): Promise<void> {
  const { db } = await openDB();
  const tx = db.transaction(STORE_MEALS, "readwrite");
  tx.objectStore(STORE_MEALS).delete(id);
  await txDone(tx);
}

export async function getMeal(id: string): Promise<MealRecord | undefined> {
  const { db } = await openDB();
  const tx = db.transaction(STORE_MEALS, "readonly");
  const res = await requestToPromise<MealRecord | undefined>(
    tx
      .objectStore(STORE_MEALS)
      .get(id) as unknown as IDBRequest<MealRecord | undefined>,
  );
  await txDone(tx);
  return res;
}

export async function listMealsDesc(limit = 200): Promise<MealRecord[]> {
  const { db } = await openDB();
  const tx = db.transaction(STORE_MEALS, "readonly");
  const store = tx.objectStore(STORE_MEALS);
  const index = store.index("by_timestamp");

  const results: MealRecord[] = [];

  // Use cursor with direction "prev" to get descending order by timestamp
  const cursorReq = index.openCursor(null, "prev");
  await new Promise<void>((resolve, reject) => {
    cursorReq.onerror = () => reject(cursorReq.error ?? new Error("Cursor error"));
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor || results.length >= limit) return resolve();
      results.push(cursor.value as MealRecord);
      cursor.continue();
    };
  });

  await txDone(tx);
  return results;
}

export async function clearMeals(): Promise<void> {
  const { db } = await openDB();
  const tx = db.transaction(STORE_MEALS, "readwrite");
  tx.objectStore(STORE_MEALS).clear();
  await txDone(tx);
}

function isValidMealType(v: unknown): v is MealRecord["mealType"] {
  return v === "breakfast" || v === "lunch" || v === "dinner" || v === "snack";
}

export async function importMealsFromJsonText(
  jsonText: string,
  options?: { mode?: "merge" | "replace" },
): Promise<{ imported: number }> {
  const mode = options?.mode ?? "merge";

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("JSON 解析失败：请确认文件内容正确");
  }

  const arr = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed && "meals" in parsed
      ? (parsed as { meals?: unknown }).meals
      : null;

  if (!Array.isArray(arr)) {
    throw new Error("导入失败：JSON 格式不正确（缺少 meals 数组）");
  }

  const meals: MealRecord[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const it = item as Partial<MealRecord> & Record<string, unknown>;

    if (typeof it.id !== "string") continue;
    if (typeof it.timestamp !== "number") continue;
    if (!isValidMealType(it.mealType)) continue;
    if (it.image != null && typeof it.image !== "string") continue;
    if (it.text != null && typeof it.text !== "string") continue;

    meals.push({
      id: it.id,
      timestamp: it.timestamp,
      mealType: it.mealType,
      image: it.image,
      text: it.text,
    });
  }

  const { db } = await openDB();
  const tx = db.transaction(STORE_MEALS, "readwrite");
  const store = tx.objectStore(STORE_MEALS);

  if (mode === "replace") {
    store.clear();
  }

  for (const m of meals) {
    store.put(m);
  }

  await txDone(tx);
  return { imported: meals.length };
}

export async function exportMealsAsJson(): Promise<Blob> {
  const meals = await listMealsDesc(100000);
  const json = JSON.stringify(
    {
      exportedAt: Date.now(),
      version: 1,
      meals,
    },
    null,
    2,
  );
  return new Blob([json], { type: "application/json;charset=utf-8" });
}
