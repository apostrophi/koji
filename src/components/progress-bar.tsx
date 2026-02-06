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
  IN_QUEUE: ["in queue"],
  IN_PROGRESS: [
    "analyzing",
    "extending",
    "blending",
    "rendering",
    "polishing",
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
  const [isMessageFading, setIsMessageFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status !== "IN_PROGRESS") return;
    const interval = setInterval(() => {
      setIsMessageFading(true);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.IN_PROGRESS.length);
        setIsMessageFading(false);
      }, 300);
    }, 4000);
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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
        {/* Shader container — clean, cinematic */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: `${preset.widthRatio} / ${preset.heightRatio}`,
            maxHeight: "60vh",
            background: "#050505",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.03)",
          }}
        >
          <Suspense
            fallback={
              <div className="absolute inset-0" style={{ background: "#050505" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalImage.localPreviewUrl}
                  alt="Processing"
                  className="w-full h-full object-cover"
                  style={{ filter: "grayscale(1) blur(30px) brightness(0.3)", opacity: 0.4 }}
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

        {/* Cinematic metadata bar — centered, elegant */}
        <div className="mt-6 flex flex-col items-center gap-4">
          {/* Timer — hero element */}
          <div className="flex items-center gap-6">
            <span
              className="tabular-nums font-light"
              style={{
                fontFamily: "var(--font-display), var(--font-mono)",
                fontSize: "2rem",
                letterSpacing: "-0.02em",
                color: "var(--text-secondary)",
                textShadow: "0 0 40px rgba(255, 255, 255, 0.1)",
              }}
            >
              {formatTime(elapsed)}
            </span>
          </div>

          {/* Status + ratio — subtle, below */}
          <div className="flex items-center gap-3">
            <span
              className="type-mono-small transition-all duration-300"
              style={{
                color: "var(--text-ghost)",
                opacity: isMessageFading ? 0 : 1,
                transform: isMessageFading ? "translateY(-4px)" : "translateY(0)",
              }}
            >
              {displayMessage}
            </span>
            <span style={{ color: "var(--text-ghost)", opacity: 0.3 }}>·</span>
            <span className="type-mono-small" style={{ color: "var(--text-ghost)" }}>
              {targetRatio}
            </span>
          </div>

          {/* Slow warning — soft, not alarming */}
          {elapsed > 35 && (
            <p
              className="type-mono-small animate-fade-in"
              style={{
                color: "var(--text-ghost)",
                marginTop: "8px",
              }}
            >
              taking a moment — you can wait or try again
            </p>
          )}
        </div>
      </div>
    );
  }

  // Fallback — simple glass progress
  return (
    <div
      className="glass p-6 animate-fade-in-up"
      role="progressbar"
      aria-label="Generation progress"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <span
          className="tabular-nums font-light"
          style={{
            fontFamily: "var(--font-display), var(--font-mono)",
            fontSize: "1.5rem",
            letterSpacing: "-0.02em",
            color: "var(--text-secondary)",
          }}
        >
          {formatTime(elapsed)}
        </span>
        <div className="w-full max-w-[200px] progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span
          className="type-mono-small"
          style={{ color: "var(--text-ghost)" }}
        >
          {displayMessage}
        </span>
      </div>
    </div>
  );
}
