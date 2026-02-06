import type { ImageFormat, CompressionMode } from "@/lib/codecs";
import {
  SMART_QUALITY,
  MAXIMUM_QUALITY,
  WEB_QUALITY,
  AVIF_EFFORT,
} from "@/lib/codecs";

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
  savings: number; // percentage saved (0-100)
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
 * Decode image from URL to ImageData.
 */
async function decodeFromUrl(url: string): Promise<{ imageData: ImageData; format: ImageFormat }> {
  // Fetch the image
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const format = detectFormat(blob);

  if (!format) {
    throw new Error("Unsupported image format");
  }

  // Decode based on format
  let imageData: ImageData;

  switch (format) {
    case "jpeg": {
      const { decodeJpeg } = await import("@/lib/codecs/jpeg");
      imageData = await decodeJpeg(buffer);
      break;
    }
    case "png": {
      const { decodePng } = await import("@/lib/codecs/png");
      imageData = await decodePng(buffer);
      break;
    }
    case "webp": {
      const { decodeWebp } = await import("@/lib/codecs/webp");
      imageData = await decodeWebp(buffer);
      break;
    }
    case "avif": {
      const { decodeAvif } = await import("@/lib/codecs/avif");
      imageData = await decodeAvif(buffer);
      break;
    }
  }

  return { imageData, format };
}

/**
 * Decode image from Blob to ImageData.
 */
async function decodeFromBlob(blob: Blob): Promise<{ imageData: ImageData; format: ImageFormat; originalSize: number }> {
  const buffer = await blob.arrayBuffer();
  const format = detectFormat(blob);

  if (!format) {
    throw new Error("Unsupported image format");
  }

  let imageData: ImageData;

  switch (format) {
    case "jpeg": {
      const { decodeJpeg } = await import("@/lib/codecs/jpeg");
      imageData = await decodeJpeg(buffer);
      break;
    }
    case "png": {
      const { decodePng } = await import("@/lib/codecs/png");
      imageData = await decodePng(buffer);
      break;
    }
    case "webp": {
      const { decodeWebp } = await import("@/lib/codecs/webp");
      imageData = await decodeWebp(buffer);
      break;
    }
    case "avif": {
      const { decodeAvif } = await import("@/lib/codecs/avif");
      imageData = await decodeAvif(buffer);
      break;
    }
  }

  return { imageData, format, originalSize: buffer.byteLength };
}

/**
 * Encode ImageData to compressed buffer.
 */
async function encode(
  imageData: ImageData,
  format: ImageFormat,
  quality: number
): Promise<ArrayBuffer> {
  switch (format) {
    case "jpeg": {
      const { encodeJpeg } = await import("@/lib/codecs/jpeg");
      return encodeJpeg(imageData, quality);
    }
    case "png": {
      const { encodePng, optimizePng } = await import("@/lib/codecs/png");
      const rawPng = await encodePng(imageData);
      return optimizePng(rawPng, 3);
    }
    case "webp": {
      const { encodeWebp } = await import("@/lib/codecs/webp");
      return encodeWebp(imageData, quality);
    }
    case "avif": {
      const { encodeAvif } = await import("@/lib/codecs/avif");
      return encodeAvif(imageData, quality, AVIF_EFFORT);
    }
  }
}

/**
 * Compress an image from URL.
 * This is the main entry point for the compression pipeline.
 */
export async function compressFromUrl(
  url: string,
  options: CompressionOptions,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  onProgress?.(5);

  // Fetch and decode
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

  const blob = await response.blob();
  const originalSize = blob.size;

  onProgress?.(15);

  const { imageData } = await decodeFromBlob(blob);

  onProgress?.(40);

  // Encode with compression
  const quality = getQuality(options.mode, options.outputFormat, options.quality);
  const compressedBuffer = await encode(imageData, options.outputFormat, quality);

  onProgress?.(90);

  // Create result
  const compressedBlob = new Blob([compressedBuffer], {
    type: getMimeType(options.outputFormat),
  });

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
 * Compress an image from Blob.
 */
export async function compressFromBlob(
  inputBlob: Blob,
  options: CompressionOptions,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  onProgress?.(5);

  const { imageData, originalSize } = await decodeFromBlob(inputBlob);

  onProgress?.(40);

  // Encode with compression
  const quality = getQuality(options.mode, options.outputFormat, options.quality);
  const compressedBuffer = await encode(imageData, options.outputFormat, quality);

  onProgress?.(90);

  // Create result
  const compressedBlob = new Blob([compressedBuffer], {
    type: getMimeType(options.outputFormat),
  });

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
 * Estimate compressed file size without actually compressing.
 * Uses heuristics based on format and quality.
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

  // Bytes per pixel estimates at quality 80
  const bppBase: Record<ImageFormat, number> = {
    png: 2.0,    // Lossless, varies a lot
    jpeg: 0.4,   // Lossy, fairly predictable
    webp: 0.25,  // More efficient than JPEG
    avif: 0.15,  // Most efficient
  };

  // Quality factor (higher quality = larger file)
  const qualityFactor = format === "png"
    ? 1.0  // PNG is lossless, quality doesn't matter much
    : 0.5 + (quality / 100) * 0.8; // Range: 0.5 at q=0 to 1.3 at q=100

  const estimatedSize = pixels * bppBase[format] * qualityFactor;

  // Don't estimate larger than original
  return Math.min(estimatedSize, originalSize);
}
