"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { HalftoneCmyk } from "@paper-design/shaders-react";
import { X, Check, RotateCcw } from "lucide-react";

interface EffectsModeProps {
  imageUrl: string;
  onClose: () => void;
  onApply: (resultUrl: string) => void;
}

type HalftoneType = "dots" | "ink" | "sharp";

interface HalftoneSettings {
  size: number;
  type: HalftoneType;
  softness: number;
  contrast: number;
  gridNoise: number;
}

const defaultSettings: HalftoneSettings = {
  size: 0.012,
  type: "dots",
  softness: 0.5,
  contrast: 1.0,
  gridNoise: 0.0,
};

export function EffectsMode({ imageUrl, onClose, onApply }: EffectsModeProps) {
  const [settings, setSettings] = useState<HalftoneSettings>(defaultSettings);
  const [isExporting, setIsExporting] = useState(false);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image and calculate display size
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setLoadedImage(img);

      // Calculate display size to fit viewport
      const maxWidth = window.innerWidth - 400 - 64; // subtract panel + padding
      const maxHeight = window.innerHeight - 64;
      const aspectRatio = img.width / img.height;

      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      setDisplaySize({ width: Math.round(width), height: Math.round(height) });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const updateSetting = <K extends keyof HalftoneSettings>(
    key: K,
    value: HalftoneSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const handleApply = useCallback(async () => {
    if (!containerRef.current) return;
    setIsExporting(true);

    try {
      const canvas = containerRef.current.querySelector("canvas");
      if (!canvas) {
        throw new Error("Canvas not found");
      }
      const dataUrl = canvas.toDataURL("image/png");
      onApply(dataUrl);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [onApply]);

  return (
    <div
      className="fixed inset-0 z-[100] flex animate-fade-in"
      style={{ background: "var(--bg-base, #050505)" }}
    >
      {/* Main canvas area */}
      <div className="flex-1 flex items-center justify-center p-8">
        {!loadedImage ? (
          <div className="flex items-center justify-center">
            <span className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
              Loading...
            </span>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative overflow-hidden"
            style={{
              borderRadius: "var(--radius-lg)",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)",
              width: displaySize.width,
              height: displaySize.height,
            }}
          >
            <HalftoneCmyk
              image={loadedImage}
              size={settings.size}
              type={settings.type}
              softness={settings.softness}
              contrast={settings.contrast}
              gridNoise={settings.gridNoise}
              style={{
                display: "block",
                width: displaySize.width,
                height: displaySize.height,
              }}
            />
          </div>
        )}
      </div>

      {/* Right panel — controls */}
      <div
        className="w-[320px] flex flex-col"
        style={{
          background: "rgba(10, 10, 10, 0.8)",
          backdropFilter: "blur(40px) saturate(1.6)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}
        >
          <span className="type-mono-small" style={{ color: "var(--text-secondary)" }}>
            Effects
          </span>
          <button
            onClick={onClose}
            className="cursor-pointer transition-all duration-200 p-1.5 rounded-md"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Effect name */}
          <div className="mb-6">
            <span className="type-mono-small" style={{ color: "var(--text-ghost)" }}>
              Halftone CMYK
            </span>
          </div>

          {/* Type selector */}
          <div className="mb-6">
            <label className="type-mono-small block mb-3" style={{ color: "var(--text-tertiary)" }}>
              Type
            </label>
            <div className="flex gap-2">
              {(["dots", "ink", "sharp"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => updateSetting("type", type)}
                  className="flex-1 cursor-pointer transition-all duration-200"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                    background: settings.type === type
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(255, 255, 255, 0.04)",
                    border: "1px solid",
                    borderColor: settings.type === type
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(255, 255, 255, 0.06)",
                  }}
                  onMouseEnter={(e) => {
                    if (settings.type !== type) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (settings.type !== type) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    }
                  }}
                >
                  <span
                    className="type-mono-small"
                    style={{
                      color: settings.type === type
                        ? "var(--text-primary)"
                        : "var(--text-tertiary)",
                    }}
                  >
                    {type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-5">
            <SliderControl
              label="Size"
              value={settings.size}
              min={0.004}
              max={0.04}
              step={0.001}
              onChange={(v) => updateSetting("size", v)}
            />
            <SliderControl
              label="Softness"
              value={settings.softness}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updateSetting("softness", v)}
            />
            <SliderControl
              label="Contrast"
              value={settings.contrast}
              min={0.5}
              max={2}
              step={0.01}
              onChange={(v) => updateSetting("contrast", v)}
            />
            <SliderControl
              label="Noise"
              value={settings.gridNoise}
              min={0}
              max={0.5}
              step={0.01}
              onChange={(v) => updateSetting("gridNoise", v)}
            />
          </div>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="mt-6 flex items-center gap-2 cursor-pointer transition-colors"
            style={{ color: "var(--text-ghost)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-ghost)"; }}
          >
            <RotateCcw size={12} strokeWidth={1.5} />
            <span className="type-mono-small">Reset to defaults</span>
          </button>
        </div>

        {/* Footer — actions */}
        <div
          className="px-5 py-4 flex gap-3"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
        >
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer transition-all duration-200"
            style={{
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; }}
          >
            <span className="type-mono-small" style={{ color: "var(--text-secondary)" }}>
              Cancel
            </span>
          </button>
          <button
            onClick={handleApply}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
            style={{
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              opacity: isExporting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isExporting) e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)";
            }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)"; }}
          >
            <Check size={14} strokeWidth={2} style={{ color: "var(--text-primary)" }} />
            <span className="type-mono-small" style={{ color: "var(--text-primary)" }}>
              {isExporting ? "Applying..." : "Apply"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Slider component
function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </label>
        <span className="type-mono-small tabular-nums" style={{ color: "var(--text-ghost)" }}>
          {value.toFixed(step < 0.01 ? 3 : 2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{
          height: 4,
          borderRadius: 2,
          appearance: "none",
          background: `linear-gradient(to right, rgba(255,255,255,0.35) ${percentage}%, rgba(255,255,255,0.08) ${percentage}%)`,
          cursor: "pointer",
        }}
      />
    </div>
  );
}
