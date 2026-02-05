'use client';

import { useEffect } from 'react';

/**
 * Tracks mouse position over `.glass-shimmer` elements and updates
 * CSS custom properties so the radial-gradient highlight follows
 * the cursor — like light catching glass.
 *
 * Ported from infinite-gallery.
 *
 * Call once at the app root. Uses event delegation on document,
 * so no per-element listeners needed.
 */
export function useGlassShimmer() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    let activeEl: HTMLElement | null = null;
    let rafId = 0;
    let mouseX = 0;
    let mouseY = 0;

    function update() {
      if (!activeEl) return;
      const rect = activeEl.getBoundingClientRect();

      // Position relative to the ::after pseudo (which is inset: -50%,
      // so it's 2x the element size). Map mouse coords to that space.
      const relX = ((mouseX - rect.left) / rect.width) * 100;
      const relY = ((mouseY - rect.top) / rect.height) * 100;

      const pseudoX = (relX + 50) / 2;
      const pseudoY = (relY + 50) / 2;

      activeEl.style.setProperty('--shimmer-x', `${pseudoX}%`);
      activeEl.style.setProperty('--shimmer-y', `${pseudoY}%`);
      activeEl.style.setProperty('--shimmer-opacity', '1');
      rafId = 0;
    }

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      const target = (e.target as HTMLElement).closest?.('.glass-shimmer') as HTMLElement | null;

      if (target !== activeEl) {
        if (activeEl) {
          activeEl.style.setProperty('--shimmer-opacity', '0');
        }
        activeEl = target;
      }

      if (activeEl) {
        if (!rafId) {
          rafId = requestAnimationFrame(update);
        }
      }
    }

    function onMouseLeave(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest?.('.glass-shimmer') as HTMLElement | null;
      if (target) {
        target.style.setProperty('--shimmer-opacity', '0');
      }
      if (target === activeEl) {
        activeEl = null;
      }
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, true);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave, true);
      if (rafId) cancelAnimationFrame(rafId);
      if (activeEl) {
        activeEl.style.setProperty('--shimmer-opacity', '0');
      }
    };
  }, []);
}
