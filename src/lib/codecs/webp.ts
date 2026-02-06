let codec: typeof import("@jsquash/webp") | null = null;

async function loadCodec() {
  if (!codec) {
    codec = await import("@jsquash/webp");
  }
  return codec;
}

export async function decodeWebp(buffer: ArrayBuffer): Promise<ImageData> {
  const { decode } = await loadCodec();
  return decode(buffer);
}

export async function encodeWebp(
  imageData: ImageData,
  quality: number = 80
): Promise<ArrayBuffer> {
  const { encode } = await loadCodec();
  return encode(imageData, { quality });
}
