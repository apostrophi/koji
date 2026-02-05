import type { GalleryItem } from "@/types";

const STORAGE_KEY = "resizer-gallery";
const MAX_ITEMS = 50;

/**
 * Validate that a parsed object has the required GalleryItem shape.
 * Prevents corrupt localStorage data from propagating through the app.
 */
function isValidGalleryItem(item: unknown): item is GalleryItem {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.createdAt === "number" &&
    typeof obj.originalFileName === "string" &&
    typeof obj.originalWidth === "number" &&
    typeof obj.originalHeight === "number" &&
    typeof obj.aspectRatio === "string" &&
    typeof obj.resolution === "string" &&
    typeof obj.prompt === "string" &&
    typeof obj.generatedImageUrl === "string" &&
    typeof obj.thumbnailDataUrl === "string"
  );
}

/**
 * Read all gallery items from localStorage.
 * Filters out any malformed entries to prevent crashes.
 */
export function getGalleryItems(): GalleryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter to only valid items — defends against corrupt storage
    return parsed.filter(isValidGalleryItem);
  } catch {
    return [];
  }
}

/**
 * Save a new gallery item. Prepends to the array (newest first).
 * Drops the oldest items if the max is exceeded.
 */
export function saveGalleryItem(item: GalleryItem): void {
  const items = getGalleryItems();
  items.unshift(item);

  // Trim to max
  if (items.length > MAX_ITEMS) {
    items.length = MAX_ITEMS;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * Remove a gallery item by ID.
 */
export function removeGalleryItem(id: string): void {
  const items = getGalleryItems().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * Clear all gallery items.
 */
export function clearGallery(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Generate a small base64 thumbnail from an image URL.
 * Used as a persistent fallback when CDN URLs expire.
 */
export function generateThumbnailDataUrl(
  imageUrl: string,
  maxSize: number = 240
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");

      // Scale proportionally
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > h) {
        h = Math.round((h / w) * maxSize);
        w = maxSize;
      } else {
        w = Math.round((w / h) * maxSize);
        h = maxSize;
      }

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };

    img.onerror = () => {
      // Return a 1x1 transparent pixel as fallback
      resolve(
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
      );
    };

    img.src = imageUrl;
  });
}
