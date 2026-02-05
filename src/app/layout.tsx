import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/**
 * GT Canon Mono — display face.
 * Variable font, woff2. Used for headlines, labels, the RESIZER logotype.
 */
const gtCanonMono = localFont({
  src: [
    {
      path: "../fonts/GT-Canon-Mono-VF.woff2",
      style: "normal",
    },
    {
      path: "../fonts/GT-Canon-Mono-Italic-VF.woff2",
      style: "italic",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

/**
 * GT Standard Mono — workhorse.
 * Variable font, ttf. Used for body text, UI labels, mono code, everything else.
 */
const gtStandardMono = localFont({
  src: [
    {
      path: "../fonts/GT-Standard-Mono-VF.ttf",
      style: "normal",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Henka \u2014 \u5909\u5316",
  description: "Reshape images to any aspect ratio with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${gtCanonMono.variable} ${gtStandardMono.variable} ambient-gradient grain-overlay`}
      >
        {/* Full viewport canvas — HUD is rendered inside page.tsx for interactivity */}
        <main className="h-screen w-screen overflow-hidden relative">
          {children}
        </main>
      </body>
    </html>
  );
}
