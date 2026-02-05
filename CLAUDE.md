# CLAUDE.md

## Project Overview

Henka (変化) — an AI-powered image resizer/outpainter built with Next.js. Users upload images, select a target aspect ratio, and the app uses fal.ai's generative AI to intelligently extend images to fill the new frame.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5.9
- **Styling:** Tailwind CSS 4, GSAP (animations), custom glass-morphism design system
- **Image Processing:** Sharp (server-side), Canvas API (client-side)
- **AI:** fal.ai (`nano-banana-pro/edit` model) via `@fal-ai/client` + server proxy
- **Icons:** lucide-react
- **Zip:** adm-zip (batch export)

## Commands

```bash
npm run dev        # Dev server on localhost:3000
npm run build      # Production build
npm start          # Run production server
npm run lint       # ESLint
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── export/route.ts          # Single image export (Sharp)
│   │   ├── export-batch/route.ts    # Batch zip export
│   │   └── fal/proxy/route.ts       # FAL.ai API proxy (keeps key server-side)
│   ├── globals.css                  # Design system, theme, animations
│   ├── layout.tsx                   # Root layout with custom fonts
│   └── page.tsx                     # Main app component (state machine)
├── components/                      # UI components (upload-zone, result-viewer, export-panel, etc.)
├── hooks/                           # Custom hooks (use-image-upload, use-generation, use-gallery, use-export)
├── lib/                             # Utilities (fal-client, image-utils, color-extract, aspect-ratios, gallery-storage)
├── types/index.ts                   # Shared TypeScript interfaces
└── fonts/                           # GT Canon Mono + GT Standard Mono (woff2/ttf)
```

## Architecture & Patterns

- **State machine phases:** upload → configure → generating → review
- **All components use `"use client"`** — interactive client-side React
- **Custom hooks** encapsulate domain logic (upload, generation, gallery, export)
- **State management:** React hooks only (useState, useCallback, useEffect, useRef, useMemo) — no Redux/Zustand
- **FAL.ai proxy pattern:** Client calls `/api/fal/proxy` → server adds `FAL_KEY` → forwards to fal.ai (key never exposed to client)
- **Gallery:** localStorage-based, max 50 items, with base64 thumbnail fallbacks for CDN expiry
- **SSR safety:** `typeof window === "undefined"` guards on localStorage access
- **Export panel:** Lazy-loaded via `React.lazy()` + Suspense

## Styling Conventions

- Tailwind utility classes for layout
- CSS custom properties for theme (dynamically updated per uploaded image)
- Glass-morphism tiers: thin, elevated, subtle (backdrop blur + saturation)
- Dark cinema aesthetic with ambient gradient that reflects uploaded image colors
- Custom animations: fade-in, scale-in, shimmer, float, glow-pulse
- `prefers-reduced-motion` respected

## Environment Variables

```
FAL_KEY=<fal-ai-api-key>   # Required in .env.local — used server-side only
```

## Key Configuration

- **TypeScript:** Strict mode, `@/*` path alias → `./src/*`
- **Next.js image domains:** `fal.media`, `v3.fal.media`, `storage.googleapis.com`
- **Upload limits:** 20MB max, accepts JPEG/PNG/WebP
- **Resolution tiers:** 1K (1024px), 2K (2048px), 4K (4096px)
- **Aspect ratios:** 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
- **Export formats:** PNG, JPEG, WebP with quality control
- **Default export:** PNG, 2K, 85% quality

## Testing

No test framework configured. Linting only via ESLint.
