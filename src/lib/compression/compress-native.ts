// Import only types/constants - no WASM dependencies
import type { ImageFormat, CompressionMode } from "@/lib/codecs/types";
import {
  SMART_QUALITY,
  MAXIMUM_QUALITY,
  WEB_QUALITY,
} from "@/lib/codecs/types";

export interface CompressionOptions {
  mode: CompressionMode;
  quality: number;
  outputFormat: ImageFormat;
}

export interface CompressionResult {
  buffer: ArrayBuffer;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  savings: number;
}

/**
 * Get the quality value for a given mode and format.
 */
function getQuality(mode: CompressionMode, format: ImageFormat, customQuality: number): number {
  switch (mode) {
    case "smart":
      return SMART_QUALITY[format];
    case "maximum":
      return MAXIMUM_QUALITY[format];
    case "web":
      return WEB_QUALITY[format];
    case "custom":
      return customQuality;
  }
}

/**
 * Get MIME type for format.
 */
function getMimeType(format: ImageFormat): string {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
  }
}

/**
 * Detect image format from blob/buffer.
 */
export function detectFormat(blob: Blob): ImageFormat | null {
  const type = blob.type.toLowerCase();
  if (type.includes("jpeg") || type.includes("jpg")) return "jpeg";
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("avif")) return "avif";
  return null;
}

/**
 * Load image from URL into an HTMLImageElement.
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/**
 * Encode image using Canvas API (browser-native).
 * Note: AVIF support depends on browser.
 */
async function encodeWithCanvas(
  img: HTMLImageElement,
  format: ImageFormat,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(img, 0, 0);

  const mimeType = getMimeType(format);
  const qualityDecimal = quality / 100;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Failed to encode as ${format}`));
      },
      mimeType,
      qualityDecimal
    );
  });
}

/**
 * Compress an image from URL using native Canvas API.
 * Works in all browsers without WASM dependencies.
 */
export async function compressFromUrl(
  url: string,
  options: CompressionOptions,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  onProgress?.(5);

  // Fetch original to get size
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const originalBlob = await response.blob();
  const originalSize = originalBlob.size;

  onProgress?.(20);

  // Load image
  const img = await loadImage(url);

  onProgress?.(40);

  // Encode with compression
  const quality = getQuality(options.mode, options.outputFormat, options.quality);

  // Try requested format, fall back to JPEG for AVIF if not supported
  let compressedBlob: Blob;
  try {
    compressedBlob = await encodeWithCanvas(img, options.outputFormat, quality);
    // Check if browser actually encoded as AVIF (some return PNG instead)
    if (options.outputFormat === "avif" && !compressedBlob.type.includes("avif")) {
      // Fall back to WebP
      compressedBlob = await encodeWithCanvas(img, "webp", quality);
    }
  } catch {
    // Fall back to JPEG
    compressedBlob = await encodeWithCanvas(img, "jpeg", quality);
  }

  onProgress?.(90);

  const compressedBuffer = await compressedBlob.arrayBuffer();
  const compressedSize = compressedBuffer.byteLength;
  const savings = originalSize > 0
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0;

  onProgress?.(100);

  return {
    buffer: compressedBuffer,
    blob: compressedBlob,
    originalSize,
    compressedSize,
    savings,
  };
}

/**
 * Compress an image from Blob using native Canvas API.
 */
export async function compressFromBlob(
  inputBlob: Blob,
  options: CompressionOptions,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  onProgress?.(5);

  const originalSize = inputBlob.size;
  const url = URL.createObjectURL(inputBlob);

  try {
    const img = await loadImage(url);

    onProgress?.(40);

    const quality = getQuality(options.mode, options.outputFormat, options.quality);

    let compressedBlob: Blob;
    try {
      compressedBlob = await encodeWithCanvas(img, options.outputFormat, quality);
      if (options.outputFormat === "avif" && !compressedBlob.type.includes("avif")) {
        compressedBlob = await encodeWithCanvas(img, "webp", quality);
      }
    } catch {
      compressedBlob = await encodeWithCanvas(img, "jpeg", quality);
    }

    onProgress?.(90);

    const compressedBuffer = await compressedBlob.arrayBuffer();
    const compressedSize = compressedBuffer.byteLength;
    const savings = originalSize > 0
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

    onProgress?.(100);

    return {
      buffer: compressedBuffer,
      blob: compressedBlob,
      originalSize,
      compressedSize,
      savings,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Estimate compressed file size without actually compressing.
 */
export function estimateSize(
  originalSize: number,
  width: number,
  height: number,
  format: ImageFormat,
  mode: CompressionMode,
  customQuality: number = 80
): number {
  const pixels = width * height;
  const quality = getQuality(mode, format, customQuality);

  const bppBase: Record<ImageFormat, number> = {
    png: 2.0,
    jpeg: 0.4,
    webp: 0.25,
    avif: 0.15,
  };

  const qualityFactor = format === "png"
    ? 1.0
    : 0.5 + (quality / 100) * 0.8;

  const estimatedSize = pixels * bppBase[format] * qualityFactor;

  return Math.min(estimatedSize, originalSize);
}
