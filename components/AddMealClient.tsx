"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { addMeal } from "@/lib/db/localDB";
import { createMealRecordId } from "@/lib/types";
import { compressImageToDataUrl } from "@/lib/utils/imageCompress";
import { detectMealTypeByTime, mealTypeToLabel } from "@/lib/utils/mealType";

function parseYmdLocal(ymd: string) {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export default function AddMealClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date"); // YYYY-MM-DD

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview meal type based on "selected date + current time"
  const mealType = useMemo(() => {
    const now = new Date();
    if (!dateParam) return detectMealTypeByTime(now);

    const dt = parseYmdLocal(dateParam);
    dt.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    return detectMealTypeByTime(dt);
  }, [dateParam]);

  async function onPickFile(file: File) {
    setError(null);
    try {
      const dataUrl = await compressImageToDataUrl(file, {
        maxSize: 1024,
        quality: 0.78,
        mimeType: "image/jpeg",
      });
      setImageDataUrl(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "图片处理失败");
    }
  }

  async function onSave() {
    setError(null);

    if (!imageDataUrl) {
      setError("先拍一张或选择一张照片吧");
      return;
    }

    try {
      setSaving(true);

      const now = new Date();
      let recordTime = now;
      if (dateParam) {
        const dt = parseYmdLocal(dateParam);
        dt.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        recordTime = dt;
      }

      const recordMealType = detectMealTypeByTime(recordTime);

      await addMeal({
        id: createMealRecordId(),
        timestamp: recordTime.getTime(),
        mealType: recordMealType,
        image: imageDataUrl,
        text: text.trim() ? text.trim() : undefined,
      });

      setDone(true);

      // Let the success state be visible for a short moment.
      // On some devices, transitions feel better with requestAnimationFrame + timeout.
      requestAnimationFrame(() => {
        setTimeout(() => {
          router.push(dateParam ? `/?date=${encodeURIComponent(dateParam)}` : "/");
          router.refresh();
        }, 520);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#FEE3E0]">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-zinc-900">记录这一餐</div>
            <div className="text-xs text-zinc-500">
              {dateParam ? `记录到：${dateParam} · ` : null}
              自动识别：{mealTypeToLabel(mealType)}
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="rounded-full"
          >
            <Link href={dateParam ? `/?date=${encodeURIComponent(dateParam)}` : "/"}>返回</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {error ? (
          <div className="mb-4 rounded-2xl border bg-white p-4 text-sm text-red-600">{error}</div>
        ) : null}

        <div className="rounded-3xl border bg-white/70 p-4 sm:p-6">
          {/* Camera input (prefer opening camera on Android) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPickFile(f);
              e.currentTarget.value = "";
            }}
          />

          {/* Gallery input (no capture => open album/file picker) */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPickFile(f);
              e.currentTarget.value = "";
            }}
          />

          {!imageDataUrl ? (
            <div className="rounded-3xl border border-dashed bg-white p-6 sm:p-10 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#FF9A8B]/15 flex items-center justify-center">
                <Camera className="h-6 w-6 text-[#FF9A8B]" />
              </div>

              <div className="mt-4 text-base font-semibold text-zinc-900">三秒记录，一眼回忆</div>
              <div className="mt-2 text-sm text-zinc-600">拍照或从相册选择一张照片</div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  className="rounded-full"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  拍照
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  从相册选择
                </Button>
              </div>

              <div className="mt-4 text-xs text-zinc-500">
                安卓体验最佳；若相机不可用，可直接选择相册。
              </div>
            </div>
          ) : (
            <div>
              <div className="relative w-full aspect-square overflow-hidden rounded-3xl bg-zinc-100">
                <Image
                  src={imageDataUrl}
                  alt="本次记录的照片"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 640px"
                  priority
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute top-3 right-3 rounded-full"
                  onClick={() => setImageDataUrl(null)}
                  aria-label="移除照片"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium text-zinc-900">这一餐想说点什么（可选）</div>
                <Textarea
                  className="mt-2 min-h-24 bg-white"
                  placeholder="比如：和朋友吃了拉面，很开心。"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={saving}
                >
                  <ImagePlus className="h-4 w-4" />
                  换一张
                </Button>

                <Button
                  className="rounded-full"
                  onClick={() => void onSave()}
                  disabled={saving || done}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {done ? "已保存" : "保存"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {done ? (
          <div className="mt-4 text-center text-sm text-zinc-600 animate-in fade-in zoom-in-95 duration-300">
            保存成功，回到时间线啦～
          </div>
        ) : null}
      </main>
    </div>
  );
}
