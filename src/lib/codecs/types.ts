// Types and constants only - no WASM imports

export type ImageFormat = "jpeg" | "png" | "webp" | "avif";
export type CompressionMode = "smart" | "maximum" | "web" | "custom";

/** Per-format quality defaults for "Smart" mode (perceptually lossless) */
export const SMART_QUALITY: Record<ImageFormat, number> = {
  jpeg: 82,
  png: 100, // OxiPNG lossless re-encode
  webp: 80,
  avif: 63,
};

/** Per-format quality defaults for "Maximum" mode (aggressive compression) */
export const MAXIMUM_QUALITY: Record<ImageFormat, number> = {
  jpeg: 60,
  png: 70,
  webp: 55,
  avif: 40,
};

/** Per-format quality defaults for "Web" mode (streaming optimized) */
export const WEB_QUALITY: Record<ImageFormat, number> = {
  jpeg: 75,
  png: 85,
  webp: 72,
  avif: 55,
};

/** AVIF effort parameter: lower = faster, higher = better compression */
export const AVIF_EFFORT = 4;
