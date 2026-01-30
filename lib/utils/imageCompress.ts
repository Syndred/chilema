export interface CompressOptions {
  maxSize?: number; // max(width,height)
  quality?: number; // 0~1
  mimeType?: "image/jpeg" | "image/webp";
}

/**
 * Compress image file to base64 dataURL for local storage.
 * - Default: JPEG, max 1024px, quality 0.75
 */
export async function compressImageToDataUrl(
  file: File,
  options: CompressOptions = {},
): Promise<string> {
  const { maxSize = 1024, quality = 0.75, mimeType = "image/jpeg" } = options;

  const bitmap = await fileToBitmap(file);

  const { width, height } = bitmap;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  // cleanup
  try {
    if ("close" in bitmap) {
      (bitmap as ImageBitmap).close();
    }
  } catch {}

  return canvas.toDataURL(mimeType, quality);
}

async function fileToBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // fallback below
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to load image"));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
