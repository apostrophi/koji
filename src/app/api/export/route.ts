import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import type { ExportRequest } from "@/types";
import { rateLimit } from "@/lib/rate-limit";
import { isAllowedImageUrl } from "@/lib/url-validation";

export const maxDuration = 30;

const VALID_FORMATS = new Set(["jpeg", "png", "webp"]);
const MAX_DIMENSION = 8192;

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const limit = rateLimit(ip);
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

    const body = (await request.json()) as ExportRequest;
    const { imageUrl, format, quality, maxWidth, maxHeight } = body;

    // Validate required fields
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "Image URL is required" },
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

    // Validate format
    const safeFormat = VALID_FORMATS.has(format) ? format : "png";

    // Validate quality (clamp to 1-100)
    const safeQuality = Math.min(100, Math.max(1, Math.round(quality || 85)));

    // Validate dimensions (positive integers, capped)
    const safeMaxWidth =
      maxWidth && Number.isFinite(maxWidth)
        ? Math.min(Math.max(1, Math.round(maxWidth)), MAX_DIMENSION)
        : undefined;
    const safeMaxHeight =
      maxHeight && Number.isFinite(maxHeight)
        ? Math.min(Math.max(1, Math.round(maxHeight)), MAX_DIMENSION)
        : undefined;

    // Fetch the image from trusted CDN
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

    const buffer = Buffer.from(arrayBuffer);

    // Build Sharp pipeline
    let pipeline = sharp(buffer);

    // Resize if dimensions specified
    if (safeMaxWidth || safeMaxHeight) {
      pipeline = pipeline.resize({
        width: safeMaxWidth,
        height: safeMaxHeight,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Apply format
    switch (safeFormat) {
      case "webp":
        pipeline = pipeline.webp({ quality: safeQuality, effort: 6 });
        break;
      case "jpeg":
        pipeline = pipeline.jpeg({ quality: safeQuality, mozjpeg: true });
        break;
      case "png":
        pipeline = pipeline.png({ compressionLevel: 9 });
        break;
      default:
        pipeline = pipeline.png({ compressionLevel: 9 });
    }

    const outputBuffer = await pipeline.toBuffer();

    const mimeType =
      safeFormat === "webp"
        ? "image/webp"
        : safeFormat === "jpeg"
          ? "image/jpeg"
          : "image/png";

    const extension = safeFormat === "jpeg" ? "jpg" : safeFormat;

    return new Response(new Uint8Array(outputBuffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="resized.${extension}"`,
        "Content-Length": outputBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      {
        error: "Something went wrong processing the image",
      },
      { status: 500 }
    );
  }
}
