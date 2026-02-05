/**
 * Read the natural dimensions of an image file.
 */
export function readImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image dimensions"));
    };

    img.src = url;
  });
}

/**
 * Create a local object URL for previewing a file.
 */
export function createLocalPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a previously created object URL.
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Generate a tiny base64 blur placeholder from an image file.
 * Creates a 10x10 thumbnail for use as a blur placeholder.
 */
export function generateBlurPlaceholder(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 10;
      canvas.height = 10;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, 10, 10);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to generate blur placeholder"));
    };

    img.src = url;
  });
}

/**
 * Format bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
