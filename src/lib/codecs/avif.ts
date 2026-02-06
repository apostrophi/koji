let codec: typeof import("@jsquash/avif") | null = null;

async function loadCodec() {
  if (!codec) {
    codec = await import("@jsquash/avif");
  }
  return codec;
}

export async function decodeAvif(buffer: ArrayBuffer): Promise<ImageData> {
  const { decode } = await loadCodec();
  const result = await decode(buffer);
  if (!result)
    throw new Error("AVIF decode returned null — corrupt or unsupported image");
  return result;
}

export async function encodeAvif(
  imageData: ImageData,
  quality: number = 63,
  speed: number = 4
): Promise<ArrayBuffer> {
  const { encode } = await loadCodec();
  return encode(imageData, {
    quality,
    speed,
  });
}
