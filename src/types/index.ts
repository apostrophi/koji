// Supported aspect ratios matching fal.ai API
export type AspectRatio =
  | "21:9"
  | "16:9"
  | "3:2"
  | "4:3"
  | "5:4"
  | "1:1"
  | "4:5"
  | "3:4"
  | "2:3"
  | "9:16";

// Resolution tiers matching fal.ai API
export type Resolution = "1K" | "2K" | "4K";

// Output formats
export type OutputFormat = "jpeg" | "png" | "webp";

// Represents the user's uploaded image
export interface UploadedImage {
  file: File;
  localPreviewUrl: string;
  falUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}

// Aspect ratio preset for the UI selector
export interface AspectRatioPreset {
  label: string;
  value: AspectRatio;
  widthRatio: number;
  heightRatio: number;
  description: string;
}

// Result from fal.ai generation
export interface GeneratedImage {
  url: string;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  contentType: string | null;
}

// Generation request
export interface GenerateRequest {
  imageUrl: string;
  aspectRatio: AspectRatio;
  prompt?: string;
  resolution: Resolution;
}

// Generation response
export interface GenerateResponse {
  success: boolean;
  image?: GeneratedImage;
  description?: string;
  error?: string;
}

// Export request (single image)
export interface ExportRequest {
  imageUrl: string;
  format: OutputFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

// Batch export request
export interface BatchExportRequest {
  imageUrl: string;
  variants: Array<{
    label: string;
    format: OutputFormat;
    quality: number;
    maxWidth?: number;
    maxHeight?: number;
  }>;
}

// Gallery item stored in localStorage
export interface GalleryItem {
  id: string;
  createdAt: number;
  originalFileName: string;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  prompt: string;
  generatedImageUrl: string;
  thumbnailDataUrl: string;
}

// Queue status from fal.ai
export type QueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";

// Overall app state phases
export type AppPhase =
  | "upload"
  | "configure"
  | "generating"
  | "review"
  | "export";
