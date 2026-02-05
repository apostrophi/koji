"use client";

import { useRef, useEffect, useCallback, useId, useState } from "react";
import gsap from "gsap";

/**
 * GooeyText — SVG filter gooey morph between two text strings.
 *
 * On hover, text1 melts into text2 via an SVG feGaussianBlur + feColorMatrix
 * alpha-threshold trick. The blur ramps up, both texts cross-fade, and the
 * feColorMatrix snaps the soft alpha back to sharp organic blobs.
 *
 * Inspired by codrops/GooeyTextHoverEffect.
 */

interface GooeyTextProps {
  text1: string;
  text2: string;
  className?: string;
  /** Font size in SVG units. Default 48. */
  fontSize?: number;
  /** Letter spacing in em. Default 0.20. */
  letterSpacing?: number;
  /** Font weight. Default 300. */
  fontWeight?: number;
  /** Animation duration in seconds. Default 0.8. */
  duration?: number;
  /** Peak blur stdDeviation. Default 3. */
  blurPeak?: number;
  /** Alpha multiplier for the goo threshold. Default 18. */
  alphaMultiplier?: number;
  /** Alpha offset for the goo threshold. Default -8. */
  alphaOffset?: number;
  /** onClick handler */
  onClick?: () => void;
  /** Extra inline style for the wrapper */
  style?: React.CSSProperties;
}

export function GooeyText({
  text1,
  text2,
  className = "",
  fontSize = 48,
  duration = 0.8,
  blurPeak = 3,
  alphaMultiplier = 18,
  alphaOffset = -8,
  onClick,
  style,
}: GooeyTextProps) {
  const id = useId();
  const filterId = `goo-${id.replace(/:/g, "")}`;

  const groupRef = useRef<SVGGElement>(null);
  const text1Ref = useRef<SVGTextElement>(null);
  const text2Ref = useRef<SVGTextElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Measure text and set viewBox dynamically
  const [viewBox, setViewBox] = useState(`0 0 200 ${fontSize + 10}`);

  useEffect(() => {
    if (!text1Ref.current || !text2Ref.current) return;

    // Slight delay to let fonts load and text render
    const raf = requestAnimationFrame(() => {
      if (!text1Ref.current || !text2Ref.current) return;
      const bbox1 = text1Ref.current.getBBox();
      const bbox2 = text2Ref.current.getBBox();
      const w = Math.max(bbox1.width, bbox2.width) + 10;
      const h = Math.max(bbox1.height, bbox2.height) + 10;
      setViewBox(`0 0 ${Math.ceil(w)} ${Math.ceil(h)}`);
    });

    return () => cancelAnimationFrame(raf);
  }, [text1, text2, fontSize]);

  // Build the GSAP timeline
  useEffect(() => {
    const group = groupRef.current;
    const t1 = text1Ref.current;
    const t2 = text2Ref.current;
    const blur = blurRef.current;
    if (!group || !t1 || !t2 || !blur) return;

    // Initial state
    gsap.set(t2, { opacity: 0 });
    gsap.set(t1, { opacity: 1 });

    const tl = gsap.timeline({ paused: true });

    tl.to(
      t1,
      {
        opacity: 0,
        duration: duration,
        ease: "power2.inOut",
      },
      0
    );

    tl.to(
      t2,
      {
        opacity: 1,
        duration: duration,
        ease: "power2.inOut",
      },
      0
    );

    // Animate blur: 0 → peak → 0
    const blurProxy = { val: 0 };
    tl.to(
      blurProxy,
      {
        val: blurPeak,
        duration: duration * 0.5,
        ease: "power2.in",
        onUpdate: () => {
          blur.setAttribute("stdDeviation", String(blurProxy.val));
        },
      },
      0
    );

    tl.to(
      blurProxy,
      {
        val: 0,
        duration: duration * 0.5,
        ease: "power2.out",
        onUpdate: () => {
          blur.setAttribute("stdDeviation", String(blurProxy.val));
        },
      },
      duration * 0.5
    );

    // Remove filter at rest for perf
    tl.eventCallback("onComplete", () => {
      if (group) group.style.filter = "none";
    });
    tl.eventCallback("onReverseComplete", () => {
      if (group) group.style.filter = "none";
    });

    tlRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [duration, blurPeak]);

  const handleEnter = useCallback(() => {
    const group = groupRef.current;
    if (group) group.style.filter = `url(#${filterId})`;
    tlRef.current?.play();
  }, [filterId]);

  const handleLeave = useCallback(() => {
    const group = groupRef.current;
    if (group) group.style.filter = `url(#${filterId})`;
    tlRef.current?.reverse();
  }, [filterId]);

  // The y position for text — SVG text baseline
  const textY = fontSize * 0.85;
  const textX = 5;

  return (
    <div
      className={className}
      style={{ display: "inline-block", cursor: onClick ? "pointer" : "default", ...style }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      <svg
        ref={svgRef}
        viewBox={viewBox}
        preserveAspectRatio="xMinYMid meet"
        style={{ width: "100%", height: "100%", overflow: "visible", display: "block" }}
        aria-label={text1}
      >
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feGaussianBlur
              ref={blurRef}
              in="SourceGraphic"
              stdDeviation="0"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${alphaMultiplier} ${alphaOffset}`}
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
        <g ref={groupRef}>
          <text
            ref={text1Ref}
            x={textX}
            y={textY}
            fill="currentColor"
            style={{
              fontFamily: "var(--font-display), var(--font-mono), monospace",
              fontSize: `${fontSize}px`,
              fontWeight: 300,
              letterSpacing: "-0.03em",
            }}
          >
            {text1}
          </text>
          <text
            ref={text2Ref}
            x={textX}
            y={textY}
            fill="currentColor"
            style={{
              fontFamily: "var(--font-display), var(--font-mono), monospace",
              fontSize: `${fontSize}px`,
              fontWeight: 300,
              letterSpacing: "-0.03em",
              opacity: 0,
            }}
          >
            {text2}
          </text>
        </g>
      </svg>
    </div>
  );
}
