/**
 * Extracts dominant colors from an image and returns
 * darkened, desaturated versions suitable for a dark ambient gradient.
 *
 * The idea: the background should feel like the image's light
 * is bleeding through darkness — not reproducing its colors exactly,
 * but responding to its warmth, coolness, brightness.
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface GradientColors {
  a: string;
  b: string;
  c: string;
  d: string;
  e: string;
}

/**
 * Sample an image at low resolution and extract its color essence.
 * Returns 5 hex colors for the ambient gradient, darkened and desaturated
 * so they feel like ambient light in darkness, not paint.
 */
export async function extractGradientColors(
  imageUrl: string
): Promise<GradientColors> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 64; // Small — we want broad color trends, not detail
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(getDefaultGradient());
        return;
      }

      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Sample 5 regions of the image (quadrants + center)
      const regions = [
        sampleRegion(data, size, 0, 0, size / 2, size / 2),          // top-left
        sampleRegion(data, size, size / 2, 0, size, size / 2),       // top-right
        sampleRegion(data, size, size / 4, size / 4, size * 3 / 4, size * 3 / 4), // center
        sampleRegion(data, size, 0, size / 2, size / 2, size),       // bottom-left
        sampleRegion(data, size, size / 2, size / 2, size, size),    // bottom-right
      ];

      // Darken each region color into a gradient-suitable dark tone
      const softened = regions.map((rgb) => softenForGradient(rgb));

      resolve({
        a: rgbToHex(softened[0]),
        b: rgbToHex(softened[1]),
        c: rgbToHex(softened[2]),
        d: rgbToHex(softened[3]),
        e: rgbToHex(softened[4]),
      });
    };

    img.onerror = () => {
      resolve(getDefaultGradient());
    };

    img.src = imageUrl;
  });
}

/**
 * Average the colors in a rectangular region of the image data.
 */
function sampleRegion(
  data: Uint8ClampedArray,
  width: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): RGB {
  let r = 0, g = 0, b = 0, count = 0;

  const startX = Math.floor(x1);
  const endX = Math.floor(x2);
  const startY = Math.floor(y1);
  const endY = Math.floor(y2);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const i = (y * width + x) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
  }

  if (count === 0) return { r: 13, g: 13, b: 13 };

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

/**
 * Take a raw image color and darken it into something that works
 * as a dark ambient gradient stop.
 *
 * The approach:
 * 1. Keep the hue — that's the color identity
 * 2. Reduce saturation to 25% (tint, don't compete)
 * 3. Push lightness to 6-18% (dark ambient glow)
 * 4. Cool bias (slight blue nudge to match the dark aesthetic)
 *
 * The result should feel like the image's light is
 * bleeding through the walls of a dark room.
 */
function softenForGradient(rgb: RGB): RGB {
  const hsl = rgbToHsl(rgb);

  // Keep the hue — the color identity
  const h = hsl.h;
  // 20% of original saturation — subtle tint, doesn't compete
  let s = hsl.s * 0.20;
  // Push lightness to 4-12% range — near-black ambient glow
  let l = 0.04 + (hsl.l * 0.08);

  // Clamp
  s = Math.min(s, 0.20);
  s = Math.max(s, 0.02);
  l = Math.min(l, 0.12);
  l = Math.max(l, 0.04);

  // No color bias — neutral black
  return hslToRgb(h, s, l);
}

function rgbToHsl(rgb: RGB): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function getDefaultGradient(): GradientColors {
  return {
    a: "#0A0A0A",
    b: "#111111",
    c: "#0D0D0D",
    d: "#131313",
    e: "#090909",
  };
}

/**
 * Apply gradient colors to the document root.
 * The CSS transition in .ambient-gradient handles the smooth animation.
 */
export function applyGradientColors(colors: GradientColors): void {
  const root = document.documentElement;
  root.style.setProperty("--gradient-a", colors.a);
  root.style.setProperty("--gradient-b", colors.b);
  root.style.setProperty("--gradient-c", colors.c);
  root.style.setProperty("--gradient-d", colors.d);
  root.style.setProperty("--gradient-e", colors.e);
}

/**
 * Reset gradient to the default dark atmospheric palette.
 */
export function resetGradientColors(): void {
  applyGradientColors(getDefaultGradient());
}
