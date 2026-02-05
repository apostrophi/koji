"use client";

import { useMemo } from "react";
import {
  ASPECT_RATIO_PRESETS,
  calculateFitDimensions,
} from "@/lib/aspect-ratios";
import type { UploadedImage, AspectRatio } from "@/types";

interface PreviewCanvasProps {
  originalImage: UploadedImage;
  targetRatio: AspectRatio;
}

export function PreviewCanvas({
  originalImage,
  targetRatio,
}: PreviewCanvasProps) {
  const preset = ASPECT_RATIO_PRESETS.find((p) => p.value === targetRatio);

  const fit = useMemo(() => {
    if (!preset) return null;
    return calculateFitDimensions(
      originalImage.width,
      originalImage.height,
      preset.widthRatio,
      preset.heightRatio
    );
  }, [originalImage.width, originalImage.height, preset]);

  if (!preset || !fit) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="type-label text-gray-400">Preview</span>
        {fit.needsOutpainting && (
          <span className="type-mono-small text-gray-400">
            ai extends {fit.outpaintDirection === "vertical" ? "top + bottom" : "left + right"} &rarr;
          </span>
        )}
      </div>
      <div className="flex items-center justify-center">
        <div
          className="relative border border-gray-200 overflow-hidden bg-white"
          style={{
            aspectRatio: `${preset.widthRatio} / ${preset.heightRatio}`,
            maxWidth: "100%",
            maxHeight: "400px",
            width:
              preset.widthRatio / preset.heightRatio >= 1 ? "100%" : "auto",
            height:
              preset.widthRatio / preset.heightRatio < 1 ? "400px" : "auto",
          }}
        >
          {/* Generation zones */}
          {fit.needsOutpainting && fit.outpaintDirection === "vertical" && (
            <>
              <div
                className="absolute left-0 right-0 top-0 generation-zone"
                style={{ height: `${fit.imageTopPercent}%` }}
              >
                <div className="generation-zone-label">
                  <span className="type-mono-small text-gray-400">generate</span>
                </div>
              </div>
              <div
                className="absolute left-0 right-0 bottom-0 generation-zone"
                style={{ height: `${fit.imageTopPercent}%` }}
              >
                <div className="generation-zone-label">
                  <span className="type-mono-small text-gray-400">generate</span>
                </div>
              </div>
            </>
          )}
          {fit.needsOutpainting && fit.outpaintDirection === "horizontal" && (
            <>
              <div
                className="absolute top-0 bottom-0 left-0 generation-zone"
                style={{ width: `${fit.imageLeftPercent}%` }}
              >
                <div className="generation-zone-label">
                  <span className="type-mono-small text-gray-400">generate</span>
                </div>
              </div>
              <div
                className="absolute top-0 bottom-0 right-0 generation-zone"
                style={{ width: `${fit.imageLeftPercent}%` }}
              >
                <div className="generation-zone-label">
                  <span className="type-mono-small text-gray-400">generate</span>
                </div>
              </div>
            </>
          )}

          {/* Original image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalImage.localPreviewUrl}
            alt="Original image positioned in new aspect ratio"
            className="absolute object-cover"
            style={{
              width: `${fit.imageWidthPercent}%`,
              height: `${fit.imageHeightPercent}%`,
              top: `${fit.imageTopPercent}%`,
              left: `${fit.imageLeftPercent}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
