import type { AspectRatio, AspectRatioPreset } from "@/types";

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  {
    label: "21:9",
    value: "21:9",
    widthRatio: 21,
    heightRatio: 9,
    description: "Ultra-wide",
  },
  {
    label: "16:9",
    value: "16:9",
    widthRatio: 16,
    heightRatio: 9,
    description: "YouTube, X header",
  },
  {
    label: "3:2",
    value: "3:2",
    widthRatio: 3,
    heightRatio: 2,
    description: "Classic photo",
  },
  {
    label: "4:3",
    value: "4:3",
    widthRatio: 4,
    heightRatio: 3,
    description: "Presentations",
  },
  {
    label: "5:4",
    value: "5:4",
    widthRatio: 5,
    heightRatio: 4,
    description: "Large format",
  },
  {
    label: "1:1",
    value: "1:1",
    widthRatio: 1,
    heightRatio: 1,
    description: "Instagram, X post",
  },
  {
    label: "4:5",
    value: "4:5",
    widthRatio: 4,
    heightRatio: 5,
    description: "Instagram portrait",
  },
  {
    label: "3:4",
    value: "3:4",
    widthRatio: 3,
    heightRatio: 4,
    description: "Pinterest",
  },
  {
    label: "2:3",
    value: "2:3",
    widthRatio: 2,
    heightRatio: 3,
    description: "Tall portrait",
  },
  {
    label: "9:16",
    value: "9:16",
    widthRatio: 9,
    heightRatio: 16,
    description: "Stories, Reels, TikTok",
  },
];

export interface FitDimensions {
  // Position and size of original image within the new frame (percentages)
  imageWidthPercent: number;
  imageHeightPercent: number;
  imageTopPercent: number;
  imageLeftPercent: number;
  // Whether outpainting is needed and in which direction
  needsOutpainting: boolean;
  outpaintDirection: "horizontal" | "vertical" | "none";
}

/**
 * Calculate how the original image fits within a target aspect ratio frame.
 * Returns percentages for CSS positioning.
 */
export function calculateFitDimensions(
  origWidth: number,
  origHeight: number,
  targetWidthRatio: number,
  targetHeightRatio: number
): FitDimensions {
  const origRatio = origWidth / origHeight;
  const targetRatio = targetWidthRatio / targetHeightRatio;

  // Ratios are effectively the same
  if (Math.abs(origRatio - targetRatio) < 0.01) {
    return {
      imageWidthPercent: 100,
      imageHeightPercent: 100,
      imageTopPercent: 0,
      imageLeftPercent: 0,
      needsOutpainting: false,
      outpaintDirection: "none",
    };
  }

  if (origRatio > targetRatio) {
    // Original is wider than target — needs vertical outpainting (top/bottom)
    const imageHeightPercent = (targetRatio / origRatio) * 100;
    return {
      imageWidthPercent: 100,
      imageHeightPercent,
      imageTopPercent: (100 - imageHeightPercent) / 2,
      imageLeftPercent: 0,
      needsOutpainting: true,
      outpaintDirection: "vertical",
    };
  } else {
    // Original is taller than target — needs horizontal outpainting (left/right)
    const imageWidthPercent = (origRatio / targetRatio) * 100;
    return {
      imageWidthPercent,
      imageHeightPercent: 100,
      imageTopPercent: 0,
      imageLeftPercent: (100 - imageWidthPercent) / 2,
      needsOutpainting: true,
      outpaintDirection: "horizontal",
    };
  }
}

/**
 * Get approximate pixel dimensions for a resolution tier at a given aspect ratio.
 * Used for display purposes only — fal.ai handles actual resolution internally.
 */
export function getResolutionDimensions(
  resolution: "1K" | "2K" | "4K",
  widthRatio: number,
  heightRatio: number
): { width: number; height: number } {
  const longEdge = resolution === "4K" ? 4096 : resolution === "2K" ? 2048 : 1024;
  const ratio = widthRatio / heightRatio;

  if (ratio >= 1) {
    // Landscape or square
    return {
      width: longEdge,
      height: Math.round(longEdge / ratio),
    };
  } else {
    // Portrait
    return {
      width: Math.round(longEdge * ratio),
      height: longEdge,
    };
  }
}
