"use client";

import { useState, useMemo, useCallback } from "react";
import { useExport } from "@/hooks/use-export";
import { ASPECT_RATIO_PRESETS, getResolutionDimensions } from "@/lib/aspect-ratios";
import type { AspectRatio, OutputFormat, Resolution } from "@/types";

interface ExportPanelProps {
  generatedImageUrl: string;
  aspectRatio: AspectRatio;
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WebP" },
];

const RESOLUTION_PRESETS: { value: Resolution | "web"; label: string }[] = [
  { value: "4K", label: "4K" },
  { value: "2K", label: "2K" },
  { value: "1K", label: "1K" },
  { value: "web", label: "Web" },
];

function estimateFileSize(w: number, h: number, format: OutputFormat | "webp", quality: number): string {
  const px = w * h;
  const bpp = format === "png" ? 2.5 : format === "jpeg" ? (quality / 100) * 1.2 : (quality / 100) * 0.8;
  const bytes = px * bpp;
  return bytes > 1024 * 1024 ? `~${(bytes / 1024 / 1024).toFixed(1)} MB` : `~${Math.round(bytes / 1024)} KB`;
}

export function ExportPanel({ generatedImageUrl, aspectRatio }: ExportPanelProps) {
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(85);
  const [selectedResolution, setSelectedResolution] = useState<Resolution | "web">("2K");
  const [downloadComplete, setDownloadComplete] = useState(false);

  const { isExporting, exportProgress, error, exportSingle, exportBatch } = useExport();
  const preset = ASPECT_RATIO_PRESETS.find((p) => p.value === aspectRatio);

  const dimensions = useMemo(() => {
    if (!preset) return null;
    if (selectedResolution === "web") return getResolutionDimensions("1K", preset.widthRatio, preset.heightRatio);
    return getResolutionDimensions(selectedResolution, preset.widthRatio, preset.heightRatio);
  }, [preset, selectedResolution]);

  const estimatedSize = useMemo(() => {
    if (!dimensions) return null;
    const fmt = selectedResolution === "web" ? "webp" as const : format;
    const q = selectedResolution === "web" ? 80 : quality;
    return estimateFileSize(dimensions.width, dimensions.height, fmt, q);
  }, [dimensions, format, quality, selectedResolution]);

  const handleDownload = useCallback(async () => {
    setDownloadComplete(false);
    const maxWidth = selectedResolution === "web" ? 1920 : selectedResolution === "1K" ? 1024 : selectedResolution === "2K" ? 2048 : undefined;
    const maxHeight = selectedResolution === "web" ? 1080 : selectedResolution === "1K" ? 1024 : selectedResolution === "2K" ? 2048 : undefined;
    const outputFormat = selectedResolution === "web" ? "webp" : format;
    const outputQuality = selectedResolution === "web" ? 80 : quality;
    const filename = `resized-${aspectRatio.replace(":", "x")}-${selectedResolution}.${outputFormat === "jpeg" ? "jpg" : outputFormat}`;
    await exportSingle({ imageUrl: generatedImageUrl, format: outputFormat, quality: outputQuality, maxWidth, maxHeight }, filename);
    setDownloadComplete(true);
    setTimeout(() => setDownloadComplete(false), 2000);
  }, [generatedImageUrl, aspectRatio, format, quality, selectedResolution, exportSingle]);

  const handleDownloadAll = useCallback(async () => {
    if (!preset) return;
    await exportBatch({
      imageUrl: generatedImageUrl,
      variants: [
        { label: "4K", format: "png", quality: 100 },
        { label: "2K", format: "png", quality: 90, maxWidth: 2048, maxHeight: 2048 },
        { label: "1K", format: "jpeg", quality: 85, maxWidth: 1024, maxHeight: 1024 },
        { label: "Web", format: "webp", quality: 80, maxWidth: 1920, maxHeight: 1080 },
      ],
    }, `resized-${aspectRatio.replace(":", "x")}-all.zip`);
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
              {selectedResolution === "web" ? "max 1920 x 1080" : `${dimensions.width} x ${dimensions.height}`}
              {estimatedSize && ` · ${estimatedSize}`}
              {` · ${selectedResolution === "web" ? "webp" : format}`}
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

        {/* Quality */}
        {selectedResolution !== "web" && format !== "png" && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>Quality</span>
              <span className="type-mono-small tabular-nums" style={{ color: "var(--text-secondary)" }}>{quality}%</span>
            </div>
            <input type="range" min={1} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full max-w-[280px]" />
          </div>
        )}

        {error && (
          <p className="type-mono-small" style={{ color: "#EF6B5B" }}>{error}</p>
        )}

        {/* Downloads */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="btn-icon-download flex items-center justify-center gap-2 px-5 py-2.5 cursor-pointer min-w-[180px] focus-visible:outline-none transition-all duration-200"
            style={{
              borderRadius: "var(--radius-md)",
              background: isExporting ? "rgba(255, 255, 255, 0.08)" : downloadComplete ? "rgba(255, 255, 255, 0.70)" : "rgba(255, 255, 255, 0.90)",
              color: isExporting ? "var(--text-tertiary)" : "#0A0A0A",
              fontWeight: 500,
              fontSize: "0.8125rem",
              boxShadow: isExporting ? "none" : "0 2px 12px rgba(255, 255, 255, 0.08)",
              pointerEvents: isExporting ? "none" : "auto",
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isExporting ? (exportProgress || "Exporting...") : downloadComplete ? "Downloaded" : `Download ${selectedResolution === "web" ? "WebP" : format.toUpperCase()}`}
          </button>

          <button
            onClick={handleDownloadAll}
            disabled={isExporting}
            className="glass-thin glass-border flex items-center justify-center gap-2 px-5 py-2.5 cursor-pointer focus-visible:outline-none transition-all duration-200"
            style={{
              borderRadius: "var(--radius-md)",
              color: isExporting ? "var(--text-tertiary)" : "var(--text-secondary)",
              fontWeight: 500,
              fontSize: "0.8125rem",
              pointerEvents: isExporting ? "none" : "auto",
            }}
          >
            Download all sizes
          </button>
        </div>
      </div>
    </div>
  );
}
