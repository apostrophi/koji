"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useExport } from "@/hooks/use-export";
import { useCompression } from "@/hooks/use-compression";
import { ASPECT_RATIO_PRESETS, getResolutionDimensions } from "@/lib/aspect-ratios";
import { downloadBlob } from "@/lib/download";
import { estimateSize } from "@/lib/compression";
import type { AspectRatio, Resolution } from "@/types";
import type { ImageFormat, CompressionMode } from "@/lib/codecs";

interface ExportPanelProps {
  generatedImageUrl: string;
  aspectRatio: AspectRatio;
}

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
];

const RESOLUTION_PRESETS: { value: Resolution | "web"; label: string }[] = [
  { value: "4K", label: "4K" },
  { value: "2K", label: "2K" },
  { value: "1K", label: "1K" },
  { value: "web", label: "Web" },
];

const COMPRESSION_MODES: { value: CompressionMode; label: string; description: string }[] = [
  { value: "smart", label: "Smart", description: "Balanced quality & size" },
  { value: "maximum", label: "Maximum", description: "Smallest file size" },
  { value: "custom", label: "Custom", description: "Manual quality control" },
];

function formatBytes(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function ExportPanel({ generatedImageUrl, aspectRatio }: ExportPanelProps) {
  const [format, setFormat] = useState<ImageFormat>("webp");
  const [quality, setQuality] = useState(80);
  const [selectedResolution, setSelectedResolution] = useState<Resolution | "web">("2K");
  const [compressionMode, setCompressionMode] = useState<CompressionMode>("smart");
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [useClientCompression, setUseClientCompression] = useState(true);

  const { isExporting, exportProgress, error: exportError, exportSingle, exportBatch } = useExport();
  const { isCompressing, progress: compressionProgress, error: compressionError, result: compressionResult, compress, reset: resetCompression } = useCompression();

  const preset = ASPECT_RATIO_PRESETS.find((p) => p.value === aspectRatio);

  const dimensions = useMemo(() => {
    if (!preset) return null;
    if (selectedResolution === "web") return getResolutionDimensions("1K", preset.widthRatio, preset.heightRatio);
    return getResolutionDimensions(selectedResolution, preset.widthRatio, preset.heightRatio);
  }, [preset, selectedResolution]);

  // Estimate file size based on current settings
  const estimatedSize = useMemo(() => {
    if (!dimensions) return null;
    // Rough original size estimate (assuming 4K PNG source)
    const originalSize = dimensions.width * dimensions.height * 3;
    return estimateSize(
      originalSize,
      dimensions.width,
      dimensions.height,
      format,
      compressionMode,
      quality
    );
  }, [dimensions, format, compressionMode, quality]);

  // Reset compression result when settings change
  useEffect(() => {
    resetCompression();
  }, [format, quality, compressionMode, selectedResolution, resetCompression]);

  const isProcessing = isExporting || isCompressing;
  const error = exportError || compressionError;
  const progress = isCompressing ? compressionProgress : 0;

  // Handle download with client-side compression
  const handleDownload = useCallback(async () => {
    setDownloadComplete(false);

    const outputFormat = selectedResolution === "web" ? "webp" as ImageFormat : format;
    const outputQuality = selectedResolution === "web" ? 72 : quality;
    const mode = selectedResolution === "web" ? "web" as CompressionMode : compressionMode;
    const filename = `henka-${aspectRatio.replace(":", "x")}-${selectedResolution}.${outputFormat === "jpeg" ? "jpg" : outputFormat}`;

    if (useClientCompression && selectedResolution !== "4K") {
      // Client-side WASM compression
      const result = await compress(generatedImageUrl, {
        mode,
        quality: outputQuality,
        outputFormat,
      });

      if (result) {
        downloadBlob(result.blob, filename);
        setDownloadComplete(true);
        setTimeout(() => setDownloadComplete(false), 2000);
      }
    } else {
      // Server-side Sharp compression (fallback for 4K or if client compression disabled)
      const maxWidth = selectedResolution === "web" ? 1920 : selectedResolution === "1K" ? 1024 : selectedResolution === "2K" ? 2048 : undefined;
      const maxHeight = selectedResolution === "web" ? 1080 : selectedResolution === "1K" ? 1024 : selectedResolution === "2K" ? 2048 : undefined;
      await exportSingle({
        imageUrl: generatedImageUrl,
        format: outputFormat === "avif" ? "webp" : outputFormat, // Server doesn't support AVIF yet
        quality: outputQuality,
        maxWidth,
        maxHeight,
      }, filename);
      setDownloadComplete(true);
      setTimeout(() => setDownloadComplete(false), 2000);
    }
  }, [generatedImageUrl, aspectRatio, format, quality, selectedResolution, compressionMode, useClientCompression, compress, exportSingle]);

  const handleDownloadAll = useCallback(async () => {
    if (!preset) return;
    await exportBatch({
      imageUrl: generatedImageUrl,
      variants: [
        { label: "4K", format: "png", quality: 100 },
        { label: "2K", format: "png", quality: 90, maxWidth: 2048, maxHeight: 2048 },
        { label: "1K", format: "jpeg", quality: 85, maxWidth: 1024, maxHeight: 1024 },
        { label: "Web", format: "webp", quality: 72, maxWidth: 1920, maxHeight: 1080 },
      ],
    }, `henka-${aspectRatio.replace(":", "x")}-all.zip`);
  }, [generatedImageUrl, aspectRatio, preset, exportBatch]);

  return (
    <div
      className="glass glass-shimmer animate-fade-in-up"
      style={{ borderRadius: "var(--radius-lg)", padding: "16px 20px" }}
    >
      <span className="type-label mb-4 block" style={{ color: "var(--text-tertiary)" }}>Export</span>

      <div className="space-y-5">
        {/* Resolution */}
        <div>
          <div className="segmented-control">
            {RESOLUTION_PRESETS.map((res) => (
              <button
                key={res.value}
                onClick={() => setSelectedResolution(res.value)}
                className={`segmented-control-item ${selectedResolution === res.value ? "segmented-control-item--active" : ""}`}
              >
                {res.label}
              </button>
            ))}
          </div>
          {dimensions && (
            <p className="type-mono-small mt-2" style={{ color: "var(--text-tertiary)" }}>
              {selectedResolution === "web" ? "max 1920 × 1080" : `${dimensions.width} × ${dimensions.height}`}
              {estimatedSize && ` · ~${formatBytes(estimatedSize)}`}
            </p>
          )}
        </div>

        {/* Format */}
        {selectedResolution !== "web" && (
          <div>
            <div className="segmented-control">
              {FORMAT_OPTIONS.map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setFormat(fmt.value)}
                  className={`segmented-control-item ${format === fmt.value ? "segmented-control-item--active" : ""}`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Compression Mode */}
        {selectedResolution !== "4K" && selectedResolution !== "web" && (
          <div>
            <span className="type-mono-small block mb-2" style={{ color: "var(--text-tertiary)" }}>
              Compression
            </span>
            <div className="segmented-control">
              {COMPRESSION_MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setCompressionMode(mode.value)}
                  className={`segmented-control-item ${compressionMode === mode.value ? "segmented-control-item--active" : ""}`}
                  title={mode.description}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quality Slider (only for custom mode and lossy formats) */}
        {selectedResolution !== "web" && selectedResolution !== "4K" && compressionMode === "custom" && format !== "png" && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>Quality</span>
              <span className="type-mono-small tabular-nums" style={{ color: "var(--text-secondary)" }}>{quality}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        {/* Compression Progress */}
        {isCompressing && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>Compressing...</span>
              <span className="type-mono-small tabular-nums" style={{ color: "var(--text-secondary)" }}>{progress}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255, 255, 255, 0.1)" }}>
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, rgba(180, 140, 255, 0.8), rgba(100, 200, 255, 0.8))",
                }}
              />
            </div>
          </div>
        )}

        {/* Compression Result */}
        {compressionResult && !isCompressing && (
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ background: "rgba(100, 200, 100, 0.08)", border: "1px solid rgba(100, 200, 100, 0.15)" }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="rgba(100, 200, 100, 0.9)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div className="type-mono-small" style={{ color: "var(--text-secondary)" }}>
              {formatBytes(compressionResult.originalSize)} → {formatBytes(compressionResult.compressedSize)}
              <span style={{ color: "rgba(100, 200, 100, 0.9)", marginLeft: "8px" }}>
                {compressionResult.savings > 0 ? `${compressionResult.savings}% smaller` : "optimized"}
              </span>
            </div>
          </div>
        )}

        {error && (
          <p className="type-mono-small" style={{ color: "#EF6B5B" }}>{error}</p>
        )}

        {/* Downloads */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="btn-icon-download flex items-center justify-center gap-2 px-5 py-2.5 cursor-pointer min-w-[180px] focus-visible:outline-none transition-all duration-200"
            style={{
              borderRadius: "var(--radius-md)",
              background: isProcessing ? "rgba(255, 255, 255, 0.08)" : downloadComplete ? "rgba(100, 200, 100, 0.7)" : "rgba(255, 255, 255, 0.90)",
              color: isProcessing ? "var(--text-tertiary)" : downloadComplete ? "#fff" : "#0A0A0A",
              fontWeight: 500,
              fontSize: "0.8125rem",
              boxShadow: isProcessing ? "none" : "0 2px 12px rgba(255, 255, 255, 0.08)",
              pointerEvents: isProcessing ? "none" : "auto",
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isProcessing
              ? (isCompressing ? "Compressing..." : (exportProgress || "Exporting..."))
              : downloadComplete
                ? "Downloaded!"
                : `Download ${selectedResolution === "web" ? "WebP" : format.toUpperCase()}`}
          </button>

          <button
            onClick={handleDownloadAll}
            disabled={isProcessing}
            className="glass-thin glass-border flex items-center justify-center gap-2 px-5 py-2.5 cursor-pointer focus-visible:outline-none transition-all duration-200"
            style={{
              borderRadius: "var(--radius-md)",
              color: isProcessing ? "var(--text-tertiary)" : "var(--text-secondary)",
              fontWeight: 500,
              fontSize: "0.8125rem",
              pointerEvents: isProcessing ? "none" : "auto",
            }}
          >
            Download all sizes
          </button>
        </div>

        {/* Privacy note */}
        <p className="type-mono-small flex items-center gap-1.5" style={{ color: "var(--text-ghost)" }}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Compression happens in your browser
        </p>
      </div>
    </div>
  );
}
