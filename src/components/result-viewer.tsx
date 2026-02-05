"use client";

import { useState, useCallback } from "react";
import type { UploadedImage, GeneratedImage, AspectRatio } from "@/types";

interface ResultViewerProps {
  originalImage: UploadedImage;
  generatedImage: GeneratedImage;
  aspectRatio: AspectRatio;
  onTryAnother: () => void;
  onStartOver: () => void;
}

export function ResultViewer({
  originalImage,
  generatedImage,
  aspectRatio,
  onTryAnother,
  onStartOver,
}: ResultViewerProps) {
  const [isComparing, setIsComparing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const ActionLink = ({
    onClick,
    children,
    active,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    active?: boolean;
  }) => (
    <button
      onClick={onClick}
      className="type-mono-small cursor-pointer transition-colors duration-200"
      style={{ color: active ? "var(--text-primary)" : "var(--text-tertiary)" }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = active ? "var(--text-primary)" : "var(--text-tertiary)";
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="animate-fade-in-up">
      {/* Actions — quiet, text-only */}
      <div className="flex items-center justify-between mb-4">
        <span className="type-label" style={{ color: "var(--text-tertiary)" }}>Result</span>
        <div className="flex items-center gap-4">
          <ActionLink onClick={() => setIsComparing(!isComparing)} active={isComparing}>
            {isComparing ? "Hide original" : "Compare"}
          </ActionLink>
          <ActionLink onClick={onTryAnother}>Try another</ActionLink>
          <ActionLink onClick={onStartOver}>Reset</ActionLink>
        </div>
      </div>

      {isComparing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="type-mono-small mb-2" style={{ color: "var(--text-tertiary)" }}>Original</p>
            <div className="overflow-hidden" style={{ borderRadius: "var(--radius-md)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalImage.localPreviewUrl} alt="Original image" className="w-full h-auto" />
            </div>
            <p className="type-mono-small mt-2" style={{ color: "var(--text-tertiary)" }}>
              {originalImage.width} &times; {originalImage.height}
            </p>
          </div>
          <div>
            <p className="type-mono-small mb-2" style={{ color: "var(--text-tertiary)" }}>{aspectRatio}</p>
            <div className="overflow-hidden" style={{ borderRadius: "var(--radius-md)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={generatedImage.url} alt={`Resized to ${aspectRatio}`} className="w-full h-auto" />
            </div>
            {generatedImage.width && generatedImage.height && (
              <p className="type-mono-small mt-2" style={{ color: "var(--text-tertiary)" }}>
                {generatedImage.width} &times; {generatedImage.height}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: "var(--radius-md)",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
            }}
          >
            {!imageLoaded && (
              <div
                className="w-full animate-pulse-soft"
                style={{
                  aspectRatio: aspectRatio.replace(":", "/"),
                  background: "rgba(255, 255, 255, 0.03)",
                }}
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generatedImage.url}
              alt={`Resized to ${aspectRatio}`}
              className={`
                w-full h-auto transition-opacity duration-[400ms] ease
                ${imageLoaded ? "opacity-100" : "opacity-0 absolute inset-0"}
              `}
              onLoad={handleImageLoad}
            />
          </div>
          {generatedImage.width && generatedImage.height && (
            <div className="flex items-center gap-3 mt-2.5">
              <p className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
                {generatedImage.width} &times; {generatedImage.height}
              </p>
              {generatedImage.fileSize && (
                <p className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
                  {(generatedImage.fileSize / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
