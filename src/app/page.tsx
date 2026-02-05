"use client";

import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useGeneration } from "@/hooks/use-generation";
import { useGallery } from "@/hooks/use-gallery";
import { generateThumbnailDataUrl } from "@/lib/gallery-storage";
import { extractGradientColors, applyGradientColors, resetGradientColors } from "@/lib/color-extract";
import { ASPECT_RATIO_PRESETS, getResolutionDimensions } from "@/lib/aspect-ratios";
import { UploadZone } from "@/components/upload-zone";
import { AspectRatioSelector } from "@/components/aspect-ratio-selector";
import { PromptInput } from "@/components/prompt-input";
import { GenerateButton } from "@/components/generate-button";
import { ProgressBar } from "@/components/progress-bar";
import { RatioPreview } from "@/components/ratio-preview";
import { GallerySheet } from "@/components/gallery-sheet";
import { useGlassShimmer } from "@/hooks/use-glass-shimmer";
import type { AppPhase, AspectRatio, Resolution } from "@/types";

const ExportPanel = lazy(() =>
  import("@/components/export-panel").then((m) => ({ default: m.ExportPanel }))
);

export default function Home() {
  useGlassShimmer();

  const {
    uploadedImage, isUploading, uploadProgress, uploadError,
    handleFileSelect, clearImage,
  } = useImageUpload();

  const [selectedRatio, setSelectedRatio] = useState<AspectRatio | null>(null);
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [showPrompt, setShowPrompt] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const {
    generatedImage, isGenerating, queueStatus, logs,
    error: generationError, generate, reset: resetGeneration,
  } = useGeneration();

  const {
    items: galleryItems, addItem: addGalleryItem,
    removeItem: removeGalleryItem, clearAll: clearGallery,
    selectItem: selectGalleryItem, selectedItem: selectedGalleryItem,
  } = useGallery();

  const savedGenerationRef = useRef<string | null>(null);
  const isViewingGalleryItem = selectedGalleryItem !== null;

  const phase: AppPhase = isViewingGalleryItem
    ? "review"
    : !uploadedImage
      ? "upload"
      : generatedImage
        ? "review"
        : isGenerating
          ? "generating"
          : "configure";

  // Extract colors from uploaded image → shift ambient gradient
  useEffect(() => {
    if (uploadedImage) {
      extractGradientColors(uploadedImage.localPreviewUrl).then((colors) => {
        applyGradientColors(colors);
      });
    } else {
      resetGradientColors();
    }
  }, [uploadedImage]);

  // Auto-save to gallery
  useEffect(() => {
    if (
      generatedImage && uploadedImage && selectedRatio &&
      savedGenerationRef.current !== generatedImage.url
    ) {
      savedGenerationRef.current = generatedImage.url;
      generateThumbnailDataUrl(generatedImage.url).then((thumbnailDataUrl) => {
        addGalleryItem({
          originalFileName: uploadedImage.file.name,
          originalWidth: uploadedImage.width,
          originalHeight: uploadedImage.height,
          aspectRatio: selectedRatio,
          resolution,
          prompt: prompt || "",
          generatedImageUrl: generatedImage.url,
          thumbnailDataUrl,
        });
      });
    }
  }, [generatedImage, uploadedImage, selectedRatio, resolution, prompt, addGalleryItem]);

  const handleGenerate = useCallback(async () => {
    if (!uploadedImage || !selectedRatio) return;
    selectGalleryItem(null);
    await generate({
      imageUrl: uploadedImage.falUrl,
      aspectRatio: selectedRatio,
      prompt: prompt || undefined,
      resolution,
    });
  }, [uploadedImage, selectedRatio, prompt, resolution, generate, selectGalleryItem]);

  const handleTryAnother = useCallback(() => {
    resetGeneration();
    selectGalleryItem(null);
    setSelectedRatio(null);
    setPrompt("");
    setShowPrompt(false);
    setIsComparing(false);
    savedGenerationRef.current = null;
  }, [resetGeneration, selectGalleryItem]);

  const handleStartOver = useCallback(() => {
    resetGeneration();
    selectGalleryItem(null);
    clearImage();
    setSelectedRatio(null);
    setPrompt("");
    setResolution("2K");
    setShowPrompt(false);
    setIsComparing(false);
    savedGenerationRef.current = null;
  }, [resetGeneration, selectGalleryItem, clearImage]);

  const handleGallerySelect = useCallback(
    (item: typeof galleryItems[number]) => {
      selectGalleryItem(item);
      resetGeneration();
    },
    [selectGalleryItem, resetGeneration]
  );

  const reviewImage = isViewingGalleryItem
    ? { url: selectedGalleryItem.generatedImageUrl, width: null, height: null, fileSize: null, contentType: null }
    : generatedImage;

  const reviewRatio = isViewingGalleryItem
    ? selectedGalleryItem.aspectRatio
    : selectedRatio;

  const hasGallery = galleryItems.length > 0;

  // Compute output dimensions for gallery item detail view
  const galleryItemPreset = selectedGalleryItem
    ? ASPECT_RATIO_PRESETS.find((p) => p.value === selectedGalleryItem.aspectRatio)
    : null;
  const galleryOutputDims = galleryItemPreset && selectedGalleryItem
    ? getResolutionDimensions(selectedGalleryItem.resolution, galleryItemPreset.widthRatio, galleryItemPreset.heightRatio)
    : null;

  return (
    <div className="h-full w-full relative flex flex-col">
      {/* HUD — floats over everything */}
      {phase !== "upload" && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 pointer-events-none">
          <button
            onClick={handleStartOver}
            className="glass pointer-events-auto cursor-pointer transition-all duration-200"
            style={{ borderRadius: "var(--radius-pill)", padding: "5px 14px" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
          >
            <span className="type-label" style={{ color: "var(--text-secondary)" }}>
              {"\u5909\u5316"}
            </span>
          </button>
        </div>
      )}

      {/* ====================================================
          UPLOAD — The whole viewport is the drop zone.
          Centered text, breathing dark canvas. That's it.
          ==================================================== */}
      {phase === "upload" && (
        <UploadZone
          uploadedImage={null}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          error={uploadError}
          onFileSelect={handleFileSelect}
          onClear={handleStartOver}
        />
      )}

      {/* ====================================================
          CONFIGURE — Image hero center, glass controls floating below
          ==================================================== */}
      {!isViewingGalleryItem && phase === "configure" && uploadedImage && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in overflow-y-auto">
          {/* Hero image — ratio preview extends fill zones without changing image size */}
          <div className="relative w-full max-w-[720px] mb-6">
            <RatioPreview uploadedImage={uploadedImage} selectedRatio={selectedRatio} />
            {/* File info badge */}
            <div
              className="absolute bottom-3 left-3 glass z-10"
              style={{
                borderRadius: "var(--radius-pill)",
                padding: "4px 12px",
              }}
            >
              <span className="type-mono-small" style={{ color: "var(--text-secondary)" }}>
                {uploadedImage.width} &times; {uploadedImage.height}
              </span>
            </div>
            {/* Replace button */}
            <button
              onClick={handleStartOver}
              className="absolute top-3 right-3 glass z-10 cursor-pointer transition-all duration-200"
              style={{
                borderRadius: "var(--radius-pill)",
                padding: "4px 12px",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
            >
              <span className="type-mono-small" style={{ color: "var(--text-secondary)" }}>Replace</span>
            </button>
          </div>

          {/* Floating control strip — glass panel with shimmer */}
          <div
            className="glass glass-shimmer w-full max-w-[720px] animate-fade-in-up"
            style={{
              borderRadius: "var(--radius-lg)",
              padding: "16px 20px",
            }}
          >
            {/* Ratio selector */}
            <AspectRatioSelector
              selectedRatio={selectedRatio}
              onSelect={setSelectedRatio}
              resolution={resolution}
            />

            {/* Prompt toggle + Resolution + Generate — appear after ratio selected */}
            {selectedRatio && (
              <div className="mt-4 pt-4 animate-fade-in" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                {/* Prompt toggle link */}
                {!showPrompt && (
                  <button
                    onClick={() => setShowPrompt(true)}
                    className="type-mono-small cursor-pointer transition-colors duration-200 mb-4 block"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                  >
                    + Add prompt
                  </button>
                )}

                {showPrompt && (
                  <div className="mb-4 animate-fade-in">
                    <PromptInput value={prompt} onChange={setPrompt} />
                  </div>
                )}

                <GenerateButton
                  onGenerate={handleGenerate}
                  disabled={!selectedRatio}
                  isLoading={isGenerating}
                  resolution={resolution}
                  onResolutionChange={setResolution}
                />
              </div>
            )}

            {generationError && (
              <p className="type-mono-small mt-3" style={{ color: "#EF6B5B" }}>
                {generationError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ====================================================
          GENERATING — Polaroid floats in the center of the void
          ==================================================== */}
      {!isViewingGalleryItem && phase === "generating" && uploadedImage && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-[640px]">
            <ProgressBar
              status={queueStatus}
              logs={logs}
              originalImage={uploadedImage}
              targetRatio={selectedRatio}
            />
            {generationError && (
              <p className="type-mono-small mt-4 text-center" style={{ color: "#EF6B5B" }}>
                {generationError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ====================================================
          REVIEW — Image dominates. Export floats at bottom.
          ==================================================== */}
      {phase === "review" && reviewImage && reviewRatio && (
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <span className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>Loading...</span>
            </div>
          }
        >
          <div className="flex-1 flex flex-col items-center animate-fade-in overflow-y-auto">
            {/* Top action bar — floating */}
            <div className="w-full max-w-[960px] px-6 pt-16 pb-4 flex items-center justify-between">
              {isViewingGalleryItem ? (
                <>
                  <div className="flex flex-col gap-0.5">
                    <span className="type-mono-small" style={{ color: "var(--text-secondary)" }}>
                      {selectedGalleryItem.originalFileName}
                    </span>
                    <span className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
                      {selectedGalleryItem.aspectRatio}
                      <span style={{ opacity: 0.4 }}> &middot; </span>
                      {selectedGalleryItem.resolution}
                      {galleryOutputDims && (
                        <>
                          <span style={{ opacity: 0.4 }}> &middot; </span>
                          {selectedGalleryItem.originalWidth}&times;{selectedGalleryItem.originalHeight}
                          <span style={{ opacity: 0.3 }}> &rarr; </span>
                          {galleryOutputDims.width}&times;{galleryOutputDims.height}
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={handleStartOver}
                    className="type-mono-small cursor-pointer transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                  >
                    New image
                  </button>
                </>
              ) : (
                <>
                  <span className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
                    {selectedRatio}
                  </span>
                  <div className="flex items-center gap-4">
                    {uploadedImage && (
                      <button
                        onClick={() => setIsComparing(!isComparing)}
                        className="type-mono-small cursor-pointer transition-colors"
                        style={{ color: isComparing ? "var(--text-primary)" : "var(--text-tertiary)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = isComparing ? "var(--text-primary)" : "var(--text-tertiary)"; }}
                      >
                        {isComparing ? "Hide original" : "Compare"}
                      </button>
                    )}
                    <button
                      onClick={handleTryAnother}
                      className="type-mono-small cursor-pointer transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                    >
                      Try another
                    </button>
                    <button
                      onClick={handleStartOver}
                      className="type-mono-small cursor-pointer transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Hero result image — or side-by-side compare */}
            {isComparing && uploadedImage ? (
              <div className="w-full max-w-[960px] px-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <p className="type-mono-small mb-2" style={{ color: "var(--text-tertiary)" }}>Original</p>
                  <div
                    className="overflow-hidden"
                    style={{
                      borderRadius: "var(--radius-md)",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                      maxHeight: "calc(100vh - 280px)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedImage.localPreviewUrl}
                      alt="Original"
                      style={{ maxHeight: "calc(100vh - 280px)", objectFit: "contain" }}
                      className="w-full h-auto block"
                    />
                  </div>
                  <p className="type-mono-small mt-2" style={{ color: "var(--text-tertiary)" }}>
                    {uploadedImage.width} &times; {uploadedImage.height}
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="type-mono-small mb-2" style={{ color: "var(--text-tertiary)" }}>{reviewRatio}</p>
                  <div
                    className="overflow-hidden"
                    style={{
                      borderRadius: "var(--radius-md)",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                      maxHeight: "calc(100vh - 280px)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={reviewImage.url}
                      alt={`Resized to ${reviewRatio}`}
                      style={{ maxHeight: "calc(100vh - 280px)", objectFit: "contain" }}
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[960px] px-6 flex justify-center">
                <div
                  className="overflow-hidden"
                  style={{
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "0 12px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04)",
                    maxHeight: "calc(100vh - 220px)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={reviewImage.url}
                    alt={`Resized to ${reviewRatio}`}
                    style={{ maxHeight: "calc(100vh - 220px)", objectFit: "contain" }}
                    className="w-full h-auto block"
                  />
                </div>
              </div>
            )}

            {/* Export panel — glass, below image */}
            <div className="w-full max-w-[960px] px-6 py-6">
              <ExportPanel generatedImageUrl={reviewImage.url} aspectRatio={reviewRatio} />
            </div>
          </div>
        </Suspense>
      )}

      {/* ====================================================
          GALLERY TRAY — bottom edge, horizontal thumbnails
          ==================================================== */}
      {hasGallery && (
        <GallerySheet
          items={galleryItems}
          selectedItemId={selectedGalleryItem?.id ?? null}
          onSelect={handleGallerySelect}
          onRemove={removeGalleryItem}
          onClearAll={clearGallery}
          onOpenChange={setIsGalleryOpen}
        />
      )}
    </div>
  );
}
