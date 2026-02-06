import type { ImageFormat, CompressionMode } from "@/lib/codecs";

export interface CompressionSettings {
  mode: CompressionMode;
  quality: number; // 1-100, used when mode is "custom"
  format: ImageFormat;
}

export interface CompressRequest {
  type: "compress";
  id: string;
  buffer: ArrayBuffer;
  inputFormat: ImageFormat;
  settings: CompressionSettings;
}

export interface CompressProgress {
  type: "progress";
  id: string;
  progress: number; // 0-100
}

export interface CompressResult {
  type: "result";
  id: string;
  buffer: ArrayBuffer;
  originalSize: number;
  compressedSize: number;
}

export interface CompressError {
  type: "error";
  id: string;
  error: string;
}

export type WorkerMessage = CompressRequest;
export type WorkerResponse = CompressProgress | CompressResult | CompressError;
