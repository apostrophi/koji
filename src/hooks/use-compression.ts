"use client";

import { useState, useCallback } from "react";
import type { ImageFormat, CompressionMode } from "@/lib/codecs/types";
import type { CompressionResult } from "@/lib/compression";

export interface CompressionState {
  isCompressing: boolean;
  progress: number;
  error: string | null;
  result: CompressionResult | null;
}

export interface UseCompressionReturn extends CompressionState {
  compress: (
    imageUrl: string,
    options: {
      mode: CompressionMode;
      quality: number;
      outputFormat: ImageFormat;
    }
  ) => Promise<CompressionResult | null>;
  reset: () => void;
}

export function useCompression(): UseCompressionReturn {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const compress = useCallback(
    async (
      imageUrl: string,
      options: {
        mode: CompressionMode;
        quality: number;
        outputFormat: ImageFormat;
      }
    ): Promise<CompressionResult | null> => {
      setIsCompressing(true);
      setProgress(0);
      setError(null);
      setResult(null);

      try {
        // Use native Canvas API compression (browser-native, no WASM)
        const { compressFromUrl } = await import("@/lib/compression/compress-native");

        const compressionResult = await compressFromUrl(
          imageUrl,
          {
            mode: options.mode,
            quality: options.quality,
            outputFormat: options.outputFormat,
          },
          (p) => setProgress(p)
        );

        setResult(compressionResult);
        setProgress(100);
        return compressionResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Compression failed";
        setError(message);
        return null;
      } finally {
        setIsCompressing(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsCompressing(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return {
    isCompressing,
    progress,
    error,
    result,
    compress,
    reset,
  };
}
