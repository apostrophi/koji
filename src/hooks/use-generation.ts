"use client";

import { useState, useCallback } from "react";
import { fal } from "@/lib/fal-client";
import type { AspectRatio, Resolution, GeneratedImage, QueueStatus } from "@/types";

const DEFAULT_PROMPT =
  "Extend this image to fill the frame, seamlessly continuing the scene, matching the original lighting, color palette, texture, and style. Do not modify or alter any part of the original image.";

interface UseGenerationReturn {
  generatedImage: GeneratedImage | null;
  isGenerating: boolean;
  queueStatus: QueueStatus | null;
  logs: string[];
  error: string | null;
  generate: (params: {
    imageUrl: string;
    aspectRatio: AspectRatio;
    prompt?: string;
    resolution: Resolution;
  }) => Promise<void>;
  reset: () => void;
}

export function useGeneration(): UseGenerationReturn {
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (params: {
      imageUrl: string;
      aspectRatio: AspectRatio;
      prompt?: string;
      resolution: Resolution;
    }) => {
      setIsGenerating(true);
      setError(null);
      setGeneratedImage(null);
      setLogs([]);
      setQueueStatus("IN_QUEUE");

      try {
        const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
          input: {
            prompt: params.prompt?.trim() || DEFAULT_PROMPT,
            image_urls: [params.imageUrl],
            aspect_ratio: params.aspectRatio,
            resolution: params.resolution,
            output_format: "png" as const,
            num_images: 1,
          },
          onQueueUpdate: (update) => {
            if (update.status === "IN_QUEUE") {
              setQueueStatus("IN_QUEUE");
              setLogs((prev) => {
                const msg = "Queued... starting shortly";
                return prev[prev.length - 1] === msg ? prev : [...prev, msg];
              });
            } else if (update.status === "IN_PROGRESS") {
              setQueueStatus("IN_PROGRESS");
              if ("logs" in update && update.logs) {
                const newLogs = update.logs.map(
                  (log: { message: string }) => log.message
                );
                setLogs(newLogs);
              }
            }
          },
        });

        setQueueStatus("COMPLETED");

        // Extract the generated image from the result
        const typedResult = result as {
          data: {
            images: Array<{
              url: string;
              width?: number;
              height?: number;
              file_size?: number;
              content_type?: string;
            }>;
          };
        };

        if (typedResult.data?.images?.[0]) {
          const img = typedResult.data.images[0];
          setGeneratedImage({
            url: img.url,
            width: img.width ?? null,
            height: img.height ?? null,
            fileSize: img.file_size ?? null,
            contentType: img.content_type ?? null,
          });
        } else {
          throw new Error("No image returned from generation");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong generating your image. Try again."
        );
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setGeneratedImage(null);
    setIsGenerating(false);
    setQueueStatus(null);
    setLogs([]);
    setError(null);
  }, []);

  return {
    generatedImage,
    isGenerating,
    queueStatus,
    logs,
    error,
    generate,
    reset,
  };
}
