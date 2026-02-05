import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import AdmZip from "adm-zip";
import type { BatchExportRequest } from "@/types";
import { rateLimit } from "@/lib/rate-limit";
import { isAllowedImageUrl } from "@/lib/url-validation";

export const maxDuration = 60;

const VALID_FORMATS = new Set(["jpeg", "png", "webp"]);
const MAX_VARIANTS = 10;
const MAX_DIMENSION = 8192;

// Sanitize filename to prevent zip slip and path traversal
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, ".");
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP (stricter for batch — more expensive operation)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const limit = rateLimit(ip, { windowMs: 60_000, maxRequests: 10 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
          },
        }
      );
    }

    const body = (await request.json()) as BatchExportRequest;
    const { imageUrl, variants } = body;

    // Validate required fields
    if (!imageUrl || typeof imageUrl !== "string" || !variants?.length) {
      return NextResponse.json(
        { error: "Image URL and variants are required" },
        { status: 400 }
      );
    }

    // SSRF protection: only allow trusted CDN origins
    if (!isAllowedImageUrl(imageUrl)) {
      return NextResponse.json(
        { error: "Image URL must be from a trusted source" },
        { status: 400 }
      );
    }

    // Limit variant count to prevent resource exhaustion
    if (variants.length > MAX_VARIANTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_VARIANTS} variants allowed` },
        { status: 400 }
      );
    }

    // Fetch the image once from trusted CDN
    const imageResponse = await fetch(imageUrl, { redirect: "error" });
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch source image" },
        { status: 502 }
      );
    }

    // Validate content-type is actually an image
    const contentType = imageResponse.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "URL did not return an image" },
        { status: 400 }
      );
    }

    const arrayBuffer = await imageResponse.arrayBuffer();

    // Reject excessively large payloads (50MB raw)
    if (arrayBuffer.byteLength > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Source image is too large" },
        { status: 413 }
      );
    }

    const sourceBuffer = Buffer.from(arrayBuffer);

    // Process all variants in parallel with validated inputs
    const processedVariants = await Promise.all(
      variants.map(async (variant) => {
        let pipeline = sharp(sourceBuffer);

        // Validate and clamp dimensions
        const safeMaxWidth =
          variant.maxWidth && Number.isFinite(variant.maxWidth)
            ? Math.min(Math.max(1, Math.round(variant.maxWidth)), MAX_DIMENSION)
            : undefined;
        const safeMaxHeight =
          variant.maxHeight && Number.isFinite(variant.maxHeight)
            ? Math.min(Math.max(1, Math.round(variant.maxHeight)), MAX_DIMENSION)
            : undefined;

        if (safeMaxWidth || safeMaxHeight) {
          pipeline = pipeline.resize({
            width: safeMaxWidth,
            height: safeMaxHeight,
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        // Validate format and quality
        const safeFormat = VALID_FORMATS.has(variant.format)
          ? variant.format
          : "png";
        const safeQuality = Math.min(
          100,
          Math.max(1, Math.round(variant.quality || 85))
        );

        switch (safeFormat) {
          case "webp":
            pipeline = pipeline.webp({ quality: safeQuality, effort: 6 });
            break;
          case "jpeg":
            pipeline = pipeline.jpeg({
              quality: safeQuality,
              mozjpeg: true,
            });
            break;
          case "png":
            pipeline = pipeline.png({ compressionLevel: 9 });
            break;
        }

        const buffer = await pipeline.toBuffer();
        const extension = safeFormat === "jpeg" ? "jpg" : safeFormat;
        // Sanitize the label to prevent path traversal in zip entries
        const safeLabel = sanitizeFilename(variant.label || "export");
        const filename = `resized-${safeLabel}.${extension}`;

        return { filename, buffer };
      })
    );

    // Create zip archive
    const zip = new AdmZip();
    for (const { filename, buffer } of processedVariants) {
      zip.addFile(filename, buffer);
    }

    const zipBuffer = zip.toBuffer();

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="resized-images.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("Batch export error:", err);
    return NextResponse.json(
      {
        error: "Something went wrong creating the zip archive",
      },
      { status: 500 }
    );
  }
}
