"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import type { QueueStatus, UploadedImage, AspectRatio } from "@/types";
import { ASPECT_RATIO_PRESETS } from "@/lib/aspect-ratios";

const GenerationShader = lazy(() =>
  import("@/components/generation-shader").then((m) => ({
    default: m.GenerationShader,
  }))
);

interface ProgressBarProps {
  status: QueueStatus | null;
  logs: string[];
  originalImage?: UploadedImage | null;
  targetRatio?: AspectRatio | null;
}

const STATUS_MESSAGES: Record<string, string[]> = {
  IN_QUEUE: ["queued, starting shortly"],
  IN_PROGRESS: [
    "analyzing composition",
    "extending the scene",
    "blending edges",
    "rendering at target resolution",
    "finalizing",
  ],
};

export function ProgressBar({
  status,
  logs,
  originalImage,
  targetRatio,
}: ProgressBarProps) {
  const [elapsed, setElapsed] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status !== "IN_PROGRESS") return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.IN_PROGRESS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    setElapsed(0);
    setMessageIndex(0);
  }, []);

  const displayMessage =
    logs.length > 0
      ? logs[logs.length - 1]
      : status === "IN_QUEUE"
        ? STATUS_MESSAGES.IN_QUEUE[0]
        : STATUS_MESSAGES.IN_PROGRESS[messageIndex];

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, "0")}`
      : `0:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent =
    status === "IN_QUEUE" ? 5 : Math.min(15 + elapsed * 2.5, 90);
  const progressNormalized = progressPercent / 100;

  const preset = targetRatio
    ? ASPECT_RATIO_PRESETS.find((p) => p.value === targetRatio)
    : null;

  // Dot grid develop — the hero moment
  if (originalImage && preset) {
    return (
      <div
        className="animate-fade-in"
        role="progressbar"
        aria-label="Generation progress"
        aria-valuenow={Math.round(progressPercent)}
      >
        {/* Shader container — clean, borderless */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: `${preset.widthRatio} / ${preset.heightRatio}`,
            maxHeight: "65vh",
            background: "#0A0A0A",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)",
          }}
        >
          <Suspense
            fallback={
              <div className="absolute inset-0 animate-pulse-soft" style={{ background: "#0A0A0A" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalImage.localPreviewUrl}
                  alt="Processing"
                  className="w-full h-full object-cover"
                  style={{ filter: "grayscale(1) blur(20px) brightness(0.5)", opacity: 0.3 }}
                />
              </div>
            }
          >
            <GenerationShader
              imageUrl={originalImage.localPreviewUrl}
              progress={progressNormalized}
            />
          </Suspense>
        </div>

        {/* Metadata below — floating, minimal */}
        <div className="flex items-center justify-between mt-3 px-1">
          <p
            className="type-mono-small transition-opacity duration-300"
            style={{ color: "var(--text-tertiary)" }}
            key={displayMessage}
          >
            {displayMessage}
          </p>
          <div className="flex items-center gap-3">
            <span className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
              {targetRatio}
            </span>
            <span className="type-mono-small tabular-nums" style={{ color: "var(--text-tertiary)" }}>
              {formatTime(elapsed)}
            </span>
          </div>
        </div>

        {elapsed > 30 && (
          <p className="type-mono-small mt-3 text-center" style={{ color: "var(--text-tertiary)" }}>
            Taking longer than expected. You can wait or try again.
          </p>
        )}
      </div>
    );
  }

  // Fallback — simple glass progress
  return (
    <div
      className="glass p-5 animate-fade-in-up"
      role="progressbar"
      aria-label="Generation progress"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="type-label" style={{ color: "var(--text-tertiary)" }}>
          {status === "IN_QUEUE" ? "Queued" : "Generating"}
        </span>
        <span className="type-mono-small tabular-nums" style={{ color: "var(--text-tertiary)" }}>
          {formatTime(elapsed)}
        </span>
      </div>
      <div className="progress-track mb-3">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="type-mono-small" style={{ color: "var(--text-tertiary)" }} key={displayMessage}>
        {displayMessage}
      </p>
    </div>
  );
}
