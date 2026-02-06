/// <reference lib="webworker" />

import type {
  CompressRequest,
  WorkerResponse,
  CompressionSettings,
} from "./types";
import type { ImageFormat } from "@/lib/codecs";
import {
  SMART_QUALITY,
  MAXIMUM_QUALITY,
  WEB_QUALITY,
  AVIF_EFFORT,
} from "@/lib/codecs";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function sendProgress(id: string, progress: number) {
  ctx.postMessage({ type: "progress", id, progress } satisfies WorkerResponse);
}

/**
 * Decode image buffer to ImageData using jSquash codecs.
 */
async function decodeBuffer(
  buffer: ArrayBuffer,
  format: ImageFormat
): Promise<ImageData> {
  switch (format) {
    case "jpeg": {
      const { decodeJpeg } = await import("@/lib/codecs/jpeg");
      return decodeJpeg(buffer);
    }
    case "png": {
      const { decodePng } = await import("@/lib/codecs/png");
      return decodePng(buffer);
    }
    case "webp": {
      const { decodeWebp } = await import("@/lib/codecs/webp");
      return decodeWebp(buffer);
    }
    case "avif": {
      const { decodeAvif } = await import("@/lib/codecs/avif");
      return decodeAvif(buffer);
    }
  }
}

/**
 * Encode ImageData to compressed buffer.
 */
async function encodeBuffer(
  imageData: ImageData,
  settings: CompressionSettings
): Promise<ArrayBuffer> {
  const quality = getQualityForSettings(settings);

  switch (settings.format) {
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

function getQualityForSettings(settings: CompressionSettings): number {
  switch (settings.mode) {
    case "smart":
      return SMART_QUALITY[settings.format];
    case "maximum":
      return MAXIMUM_QUALITY[settings.format];
    case "web":
      return WEB_QUALITY[settings.format];
    case "custom":
      return settings.quality;
  }
}

async function processImage(request: CompressRequest): Promise<void> {
  const { id, buffer, inputFormat, settings } = request;

  try {
    // Stage 1: Decode (0-30%)
    sendProgress(id, 5);
    const imageData = await decodeBuffer(buffer, inputFormat);
    sendProgress(id, 30);

    // Stage 2: Encode (30-90%)
    sendProgress(id, 35);
    const compressedBuffer = await encodeBuffer(imageData, settings);
    sendProgress(id, 90);

    // Stage 3: Complete (100%)
    const response: WorkerResponse = {
      type: "result",
      id,
      buffer: compressedBuffer,
      originalSize: buffer.byteLength,
      compressedSize: compressedBuffer.byteLength,
    };

    // Transfer the buffer (zero-copy)
    ctx.postMessage(response, [compressedBuffer]);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown compression error";
    ctx.postMessage({
      type: "error",
      id,
      error: errorMessage,
    } satisfies WorkerResponse);
  }
}

ctx.addEventListener("message", (event: MessageEvent<CompressRequest>) => {
  if (event.data.type === "compress") {
    processImage(event.data);
  }
});
