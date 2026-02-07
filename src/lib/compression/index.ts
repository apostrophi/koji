// Use native Canvas API compression (browser-native, no WASM dependencies)
export {
  compressFromUrl,
  compressFromBlob,
  detectFormat,
  estimateSize,
  type CompressionOptions,
  type CompressionResult,
} from "./compress-native";

export type { CompressionSettings } from "./types";
