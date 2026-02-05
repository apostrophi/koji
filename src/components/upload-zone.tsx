"use client";

import { useState, useRef, useCallback } from "react";
import { GooeyText } from "@/components/gooey-text";
import type { UploadedImage } from "@/types";

interface UploadZoneProps {
  uploadedImage: UploadedImage | null;
  isUploading: boolean;
  uploadProgress: string;
  error: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

export function UploadZone({
  uploadedImage: _uploadedImage,
  isUploading,
  uploadProgress,
  error,
  onFileSelect,
  onClear,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only leave if we're actually leaving the container
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX <= rect.left || clientX >= rect.right ||
      clientY <= rect.top || clientY >= rect.bottom
    ) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
      e.target.value = "";
    },
    [onFileSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // Error state — centered in viewport
  if (error) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={onClear}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="animate-fade-in text-center px-6">
          <p className="type-body mb-2" style={{ color: "#EF6B5B" }}>{error}</p>
          <p className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
            Click anywhere or drop another file
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    );
  }

  // Uploading state — centered in viewport
  if (isUploading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="animate-fade-in text-center">
          <div className="progress-track mx-auto mb-4" style={{ width: 160 }}>
            <div className="progress-indeterminate" />
          </div>
          <p className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
            {uploadProgress}
          </p>
        </div>
      </div>
    );
  }

  // Default — The entire viewport IS the drop zone. No box. No border.
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload an image"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="flex-1 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 focus-visible:outline-none"
      style={{
        // When dragging over, the whole screen gets a subtle edge glow
        boxShadow: isDragOver
          ? "inset 0 0 120px 20px rgba(255, 255, 255, 0.03)"
          : "none",
      }}
    >
      <div className="text-center animate-fade-in-up flex flex-col items-center">
        {/* Big gooey hero logotype */}
        <div
          style={{
            color: isDragOver ? "var(--text-primary)" : "var(--text-secondary)",
            transition: "color 300ms ease",
            width: "clamp(200px, 40vw, 380px)",
            marginBottom: 8,
          }}
        >
          {isDragOver ? (
            <h2 className="type-display">Drop</h2>
          ) : (
            <GooeyText
              text1="HENKA"
              text2={"\u5909\u5316"}
              fontSize={64}
              duration={0.9}
              blurPeak={4}
            />
          )}
        </div>

        <p
          className="type-body mb-6"
          style={{
            color: "var(--text-tertiary)",
            maxWidth: 320,
            transition: "opacity 300ms ease",
            opacity: isDragOver ? 0 : 1,
          }}
        >
          Drop an image anywhere, or click to browse
        </p>
        <p
          className="type-mono-small"
          style={{
            color: "var(--text-tertiary)",
            opacity: isDragOver ? 0 : 0.4,
            transition: "opacity 300ms ease",
          }}
        >
          PNG, JPG, or WebP up to 20 MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
