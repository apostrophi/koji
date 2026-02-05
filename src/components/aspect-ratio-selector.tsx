"use client";

import { memo, useCallback, useMemo } from "react";
import { ASPECT_RATIO_PRESETS, getResolutionDimensions } from "@/lib/aspect-ratios";
import type { AspectRatio, Resolution } from "@/types";

interface AspectRatioSelectorProps {
  selectedRatio: AspectRatio | null;
  onSelect: (ratio: AspectRatio) => void;
  resolution?: Resolution;
}

const RatioButton = memo(function RatioButton({
  preset,
  isSelected,
  onSelect,
}: {
  preset: (typeof ASPECT_RATIO_PRESETS)[number];
  isSelected: boolean;
  onSelect: (ratio: AspectRatio) => void;
}) {
  const handleClick = useCallback(() => {
    onSelect(preset.value);
  }, [preset.value, onSelect]);

  const ratio = preset.widthRatio / preset.heightRatio;
  let rectW: number;
  let rectH: number;
  if (ratio >= 1) {
    rectW = 22;
    rectH = Math.max(Math.round(22 / ratio), 4);
  } else {
    rectH = 22;
    rectW = Math.max(Math.round(22 * ratio), 4);
  }

  return (
    <button
      role="radio"
      aria-checked={isSelected}
      aria-label={`${preset.label} — ${preset.description}`}
      onClick={handleClick}
      className="flex flex-col items-center gap-1.5 px-2.5 py-2 cursor-pointer transition-all duration-200 focus-visible:outline-none"
      style={{
        borderRadius: "calc(var(--radius-md) - 3px)",
        background: isSelected ? "rgba(255, 255, 255, 0.10)" : "transparent",
        boxShadow: isSelected ? "0 1px 0 0 rgba(255, 255, 255, 0.06) inset, 0 2px 6px rgba(0, 0, 0, 0.2)" : "none",
        color: isSelected ? "var(--text-primary)" : "var(--text-tertiary)",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.color = "var(--text-secondary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-tertiary)";
        }
      }}
    >
      <div className="flex items-center justify-center w-6 h-6">
        <div
          style={{
            width: rectW,
            height: rectH,
            borderRadius: 2,
            border: isSelected
              ? "1.5px solid var(--text-primary)"
              : "1.5px solid currentColor",
            opacity: isSelected ? 0.9 : 0.4,
            transition: "all 200ms",
          }}
        />
      </div>
      <span className="type-mono-small leading-none">{preset.label}</span>
    </button>
  );
});

export function AspectRatioSelector({
  selectedRatio,
  onSelect,
  resolution = "2K",
}: AspectRatioSelectorProps) {
  const selectedPreset = ASPECT_RATIO_PRESETS.find(
    (p) => p.value === selectedRatio
  );

  const dims = useMemo(() => {
    if (!selectedPreset || !resolution) return null;
    return getResolutionDimensions(
      resolution,
      selectedPreset.widthRatio,
      selectedPreset.heightRatio
    );
  }, [resolution, selectedPreset]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-baseline gap-2.5 mb-2">
        <span className="type-label" style={{ color: "var(--text-tertiary)" }}>Ratio</span>
        {selectedPreset && (
          <span className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
            {selectedPreset.description}
            {dims && <> &middot; {dims.width}&times;{dims.height}</>}
          </span>
        )}
      </div>
      <div
        role="radiogroup"
        aria-label="Select aspect ratio"
        className="inline-flex gap-0.5"
        style={{
          padding: 3,
          borderRadius: "var(--radius-md)",
          background: "rgba(255, 255, 255, 0.03)",
        }}
      >
        {ASPECT_RATIO_PRESETS.map((preset) => (
          <RatioButton
            key={preset.value}
            preset={preset}
            isSelected={selectedRatio === preset.value}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
