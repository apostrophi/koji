let codec: typeof import("@jsquash/jpeg") | null = null;

async function loadCodec() {
  if (!codec) {
    codec = await import("@jsquash/jpeg");
  }
  return codec;
}

export async function decodeJpeg(buffer: ArrayBuffer): Promise<ImageData> {
  const { decode } = await loadCodec();
  return decode(buffer);
}

export async function encodeJpeg(
  imageData: ImageData,
  quality: number = 82
): Promise<ArrayBuffer> {
  const { encode } = await loadCodec();
  return encode(imageData, {
    quality,
    progressive: true,
  });
}
