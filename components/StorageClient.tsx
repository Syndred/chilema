"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  clearMeals,
  exportMealsAsJson,
  importMealsFromJsonText,
  listMealsDesc,
} from "@/lib/db/localDB";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// Rough estimate: base64 string length -> bytes.
// data URL like: "data:image/jpeg;base64,XXXX"
function estimateDataUrlBytes(dataUrl: string) {
  const commaIdx = dataUrl.indexOf(",");
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return Math.floor((base64.length * 3) / 4);
}

export default function StorageClient() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importModeRef = useRef<"merge" | "replace">("merge");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [recordCount, setRecordCount] = useState(0);
  const [imageBytes, setImageBytes] = useState(0);

  const [quota, setQuota] = useState<number | null>(null);
  const [usage, setUsage] = useState<number | null>(null);

  async function load() {
    try {
      setError(null);
      setNotice(null);
      setLoading(true);

      // 1) storage quota/usage (if supported)
      if (typeof navigator !== "undefined" && "storage" in navigator) {
        const est = await navigator.storage.estimate();
        setQuota(typeof est.quota === "number" ? est.quota : null);
        setUsage(typeof est.usage === "number" ? est.usage : null);
      }

      // 2) meals stats (rough)
      const meals = await listMealsDesc(5000);
      setRecordCount(meals.length);
      setImageBytes(
        meals.reduce((sum, m) => sum + (m.image ? estimateDataUrlBytes(m.image) : 0), 0),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const usageRatio = useMemo(() => {
    if (quota && usage) return usage / quota;
    return null;
  }, [quota, usage]);

  async function onExport() {
    try {
      setError(null);
      setNotice(null);
      const blob = await exportMealsAsJson();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chilema-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setNotice("已导出，正在回到首页…");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "导出失败");
    }
  }

  async function onClear() {
    const ok = window.confirm(
      "确定要清空全部记录吗？\n此操作不可撤销（建议先导出）。",
    );
    if (!ok) return;

    try {
      setError(null);
      setNotice(null);
      await clearMeals();
      await load();
      setNotice("已清空。轻装上阵，从下一餐开始～");
    } catch (e) {
      setError(e instanceof Error ? e.message : "清空失败");
    }
  }

  async function onImportFile(file: File) {
    try {
      setError(null);
      setNotice(null);

      const jsonText = await file.text();
      const { imported } = await importMealsFromJsonText(jsonText, {
        mode: importModeRef.current,
      });

      await load();

      const msg =
        importModeRef.current === "replace"
          ? `已导入并覆盖：${imported} 条`
          : `已导入（合并）：${imported} 条`;

      setNotice(`${msg}，正在回到首页…`);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败");
    }
  }

  function pickImport(mode: "merge" | "replace") {
    importModeRef.current = mode;
    fileInputRef.current?.click();
  }

  return (
    <div className="min-h-dvh bg-[#FEE3E0]">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-zinc-900">数据与存储</div>
            <div className="text-xs text-zinc-500">纯本地存储，不上传云端</div>
          </div>

          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">返回</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImportFile(f);
            e.currentTarget.value = "";
          }}
        />

        {error ? (
          <div className="mb-4 rounded-2xl border bg-white p-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="mb-4 rounded-2xl border bg-white p-4 text-sm text-zinc-700">
            {notice}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 text-center text-sm text-zinc-600">加载中…</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl border bg-white/70 p-4">
              <div className="text-sm font-medium text-zinc-900">存储概览</div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border bg-white p-3">
                  <div className="text-xs text-zinc-500">记录数量</div>
                  <div className="mt-1 text-base font-semibold text-zinc-900">
                    {recordCount}
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-3">
                  <div className="text-xs text-zinc-500">照片占用（估算）</div>
                  <div className="mt-1 text-base font-semibold text-zinc-900">
                    {formatBytes(imageBytes)}
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-3">
                  <div className="text-xs text-zinc-500">浏览器存储</div>
                  <div className="mt-1 text-base font-semibold text-zinc-900">
                    {usage != null && quota != null
                      ? `${formatBytes(usage)} / ${formatBytes(quota)}`
                      : "当前浏览器不支持估算"}
                  </div>
                </div>
              </div>

              {usageRatio != null && usageRatio >= 0.85 ? (
                <div className="mt-3 rounded-2xl border bg-[#FF9A8B]/10 p-3 text-sm text-zinc-800">
                  存储快满了（已使用 {(usageRatio * 100).toFixed(0)}%）。建议导出后清理，
                  以免后续保存失败。
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border bg-white/70 p-4">
              <div className="text-sm font-medium text-zinc-900">数据操作</div>
              <div className="mt-3 flex flex-col sm:flex-row gap-3">
                <Button className="rounded-full" onClick={() => void onExport()}>
                  <Download className="h-4 w-4" />
                  一键导出 JSON
                </Button>

                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => pickImport("merge")}
                >
                  <Upload className="h-4 w-4" />
                  导入（合并）
                </Button>

                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => pickImport("replace")}
                >
                  <Upload className="h-4 w-4" />
                  导入并覆盖
                </Button>

                <Button
                  variant="destructive"
                  className="rounded-full"
                  onClick={() => void onClear()}
                >
                  <Trash2 className="h-4 w-4" />
                  清空全部记录
                </Button>
              </div>

              <div className="mt-3 text-xs text-zinc-500">
                提示：导出文件只包含你的记录数据（图片为 base64），你可以自行备份到本地；导入支持“合并/覆盖”两种模式。
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
