let pngCodec: typeof import("@jsquash/png") | null = null;
let oxipngCodec: typeof import("@jsquash/oxipng") | null = null;

async function loadPngCodec() {
  if (!pngCodec) {
    pngCodec = await import("@jsquash/png");
  }
  return pngCodec;
}

async function loadOxipng() {
  if (!oxipngCodec) {
    oxipngCodec = await import("@jsquash/oxipng");
  }
  return oxipngCodec;
}

export async function decodePng(buffer: ArrayBuffer): Promise<ImageData> {
  const { decode } = await loadPngCodec();
  return decode(buffer);
}

export async function encodePng(imageData: ImageData): Promise<ArrayBuffer> {
  const { encode } = await loadPngCodec();
  return encode(imageData);
}

/**
 * Lossless PNG optimization via OxiPNG.
 * Takes raw PNG bytes and returns optimized PNG bytes.
 * level 3 is a good balance of speed vs compression.
 */
export async function optimizePng(
  pngBuffer: ArrayBuffer,
  level: number = 3
): Promise<ArrayBuffer> {
  const { optimise } = await loadOxipng();
  return optimise(pngBuffer, { level });
}
