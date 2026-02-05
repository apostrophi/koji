import { fal } from "@fal-ai/client";

// Route all fal.ai calls through the Next.js proxy
// This keeps FAL_KEY server-side only
fal.config({
  proxyUrl: "/api/fal/proxy",
});

export { fal };
