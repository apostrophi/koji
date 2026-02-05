"use client";

import { useMemo } from "react";
import { ASPECT_RATIO_PRESETS, calculateFitDimensions } from "@/lib/aspect-ratios";
import type { AspectRatio, UploadedImage } from "@/types";

interface RatioPreviewProps {
  uploadedImage: UploadedImage;
  selectedRatio: AspectRatio | null;
}

/**
 * Shows the uploaded image inside the target aspect ratio frame.
 * Fill zones rendered as dot-grid areas with dashed boundaries.
 * Uses CSS aspect-ratio on the container so both horizontal and vertical fill work.
 */
export function RatioPreview({ uploadedImage, selectedRatio }: RatioPreviewProps) {
  const preset = ASPECT_RATIO_PRESETS.find((p) => p.value === selectedRatio);

  const fit = useMemo(() => {
    if (!preset) return null;
    return calculateFitDimensions(
      uploadedImage.width,
      uploadedImage.height,
      preset.widthRatio,
      preset.heightRatio
    );
  }, [uploadedImage, preset]);

  // No ratio selected or same ratio — just show the image
  if (!preset || !fit || !fit.needsOutpainting) {
    return (
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={uploadedImage.localPreviewUrl}
          alt="Uploaded image"
          className="w-full h-auto block"
          style={{ maxHeight: "50vh", objectFit: "contain", background: "#0A0A0A" }}
        />
      </div>
    );
  }

  const isHorizontal = fit.outpaintDirection === "horizontal";

  // Dot grid pattern for fill zones
  const dotPattern = {
    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
    backgroundSize: "6px 6px",
  };

  // Dashed line style
  const dashH = "repeating-linear-gradient(to right, rgba(255,255,255,0.25) 0px, rgba(255,255,255,0.25) 4px, transparent 4px, transparent 8px)";
  const dashV = "repeating-linear-gradient(to bottom, rgba(255,255,255,0.25) 0px, rgba(255,255,255,0.25) 4px, transparent 4px, transparent 8px)";

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: `${preset.widthRatio} / ${preset.heightRatio}`,
        maxHeight: "55vh",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)",
        background: "#0A0A0A",
      }}
    >
      {/* Fill zone background — dot grid across the entire frame */}
      <div className="absolute inset-0" style={dotPattern} />

      {/* The original image positioned where it will sit in the final output */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: `${fit.imageTopPercent}%`,
          left: `${fit.imageLeftPercent}%`,
          width: `${fit.imageWidthPercent}%`,
          height: `${fit.imageHeightPercent}%`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={uploadedImage.localPreviewUrl}
          alt="Original position"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Dashed boundary lines */}
      {isHorizontal ? (
        <>
          {/* Left boundary */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${fit.imageLeftPercent}%`,
              width: 1,
              backgroundImage: dashV,
            }}
          />
          {/* Right boundary */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${fit.imageLeftPercent + fit.imageWidthPercent}%`,
              width: 1,
              backgroundImage: dashV,
            }}
          />
        </>
      ) : (
        <>
          {/* Top boundary */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: `${fit.imageTopPercent}%`,
              height: 1,
              backgroundImage: dashH,
            }}
          />
          {/* Bottom boundary */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: `${fit.imageTopPercent + fit.imageHeightPercent}%`,
              height: 1,
              backgroundImage: dashH,
            }}
          />
        </>
      )}
    </div>
  );
}
