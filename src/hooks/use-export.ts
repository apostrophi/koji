"use client";

import { useState, useCallback } from "react";
import { downloadBlob } from "@/lib/download";
import type { ExportRequest, BatchExportRequest } from "@/types";

interface UseExportReturn {
  isExporting: boolean;
  exportProgress: string;
  error: string | null;
  exportSingle: (params: ExportRequest, filename: string) => Promise<void>;
  exportBatch: (
    params: BatchExportRequest,
    filename: string
  ) => Promise<void>;
}

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const exportSingle = useCallback(
    async (params: ExportRequest, filename: string) => {
      setIsExporting(true);
      setError(null);
      setExportProgress(`Exporting ${filename}...`);

      try {
        const response = await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Export failed");
        }

        const blob = await response.blob();
        downloadBlob(blob, filename);
        setExportProgress("");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong exporting your image. Try again."
        );
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportBatch = useCallback(
    async (params: BatchExportRequest, filename: string) => {
      setIsExporting(true);
      setError(null);
      setExportProgress("Creating zip archive...");

      try {
        const response = await fetch("/api/export-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Batch export failed");
        }

        const blob = await response.blob();
        downloadBlob(blob, filename);
        setExportProgress("");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong creating the zip. Try again."
        );
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return {
    isExporting,
    exportProgress,
    error,
    exportSingle,
    exportBatch,
  };
}
