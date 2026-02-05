"use client";

import type { Resolution } from "@/types";

interface GenerateButtonProps {
  onGenerate: () => void;
  disabled: boolean;
  isLoading: boolean;
  resolution: Resolution;
  onResolutionChange: (resolution: Resolution) => void;
}

const RESOLUTIONS: { value: Resolution; label: string; cost: string }[] = [
  { value: "1K", label: "1K", cost: "$0.15" },
  { value: "2K", label: "2K", cost: "$0.15" },
  { value: "4K", label: "4K", cost: "$0.30" },
];

export function GenerateButton({
  onGenerate,
  disabled,
  isLoading,
  resolution,
  onResolutionChange,
}: GenerateButtonProps) {
  const selectedRes = RESOLUTIONS.find((r) => r.value === resolution);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="type-label" style={{ color: "var(--text-tertiary)" }}>Resolution</span>
        {!isLoading && selectedRes && (
          <span className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
            ~{selectedRes.cost}/image
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="segmented-control">
          {RESOLUTIONS.map((res) => (
            <button
              key={res.value}
              onClick={() => onResolutionChange(res.value)}
              disabled={isLoading}
              className={`
                segmented-control-item
                ${resolution === res.value ? "segmented-control-item--active" : ""}
                ${isLoading ? "pointer-events-none" : ""}
              `}
            >
              {res.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={disabled || isLoading}
        className="flex items-center justify-center w-full px-6 py-2.5 cursor-pointer focus-visible:outline-none transition-all duration-200"
        style={{
          borderRadius: "var(--radius-md)",
          background:
            disabled
              ? "rgba(255, 255, 255, 0.04)"
              : isLoading
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(255, 255, 255, 0.90)",
          color:
            disabled
              ? "var(--text-tertiary)"
              : isLoading
                ? "var(--text-secondary)"
                : "#0A0A0A",
          fontWeight: 500,
          fontSize: "0.8125rem",
          letterSpacing: "0.01em",
          boxShadow:
            disabled || isLoading
              ? "none"
              : "0 2px 12px rgba(255, 255, 255, 0.08)",
          pointerEvents: disabled || isLoading ? "none" : "auto",
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isLoading) {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(255, 255, 255, 0.12)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          if (!disabled && !isLoading) {
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(255, 255, 255, 0.08)";
          }
        }}
        onMouseDown={(e) => {
          if (!disabled && !isLoading) e.currentTarget.style.transform = "scale(0.97)";
        }}
        onMouseUp={(e) => {
          if (!disabled && !isLoading) e.currentTarget.style.transform = "translateY(-1px)";
        }}
      >
        {isLoading ? (
          <span className="animate-pulse-soft">Generating...</span>
        ) : (
          <span>Generate</span>
        )}
      </button>
    </div>
  );
}
