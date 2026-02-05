"use client";

import { useState, useCallback } from "react";
import { fal } from "@/lib/fal-client";
import {
  readImageDimensions,
  createLocalPreviewUrl,
  revokePreviewUrl,
} from "@/lib/image-utils";
import type { UploadedImage } from "@/types";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface UseImageUploadReturn {
  uploadedImage: UploadedImage | null;
  isUploading: boolean;
  uploadProgress: string;
  uploadError: string | null;
  handleFileSelect: (file: File) => Promise<void>;
  clearImage: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError(
        "That file type isn't supported. Use a PNG, JPG, or WebP image."
      );
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        "That file is over 20MB. Try a smaller image or compress it first."
      );
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress("Reading image...");

    try {
      // Read dimensions
      const { width, height } = await readImageDimensions(file);

      // Create local preview
      const localPreviewUrl = createLocalPreviewUrl(file);

      setUploadProgress("Uploading to cloud...");

      // Upload to fal.ai storage
      const falUrl = await fal.storage.upload(file);

      setUploadedImage({
        file,
        localPreviewUrl,
        falUrl,
        width,
        height,
        aspectRatio: width / height,
      });

      setUploadProgress("");
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? `Upload failed: ${err.message}`
          : "Upload failed. Check your connection and try again."
      );
    } finally {
      setIsUploading(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    if (uploadedImage) {
      revokePreviewUrl(uploadedImage.localPreviewUrl);
    }
    setUploadedImage(null);
    setUploadError(null);
    setUploadProgress("");
  }, [uploadedImage]);

  return {
    uploadedImage,
    isUploading,
    uploadProgress,
    uploadError,
    handleFileSelect,
    clearImage,
  };
}
