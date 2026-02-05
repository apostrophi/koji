"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { GalleryItem } from "@/types";

interface GalleryTrayProps {
  items: GalleryItem[];
  selectedItemId: string | null;
  onSelect: (item: GalleryItem) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

function TrayThumb({
  item,
  isSelected,
  onSelect,
  onRemove,
}: {
  item: GalleryItem;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex-shrink-0 cursor-pointer transition-all duration-200 focus-visible:outline-none group"
      style={{
        width: 96,
        height: 96,
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
        outline: isSelected ? "2px solid rgba(255, 255, 255, 0.4)" : "2px solid transparent",
        outlineOffset: 2,
        transform: isSelected ? "scale(1.08)" : isHovered ? "scale(1.04)" : "none",
        boxShadow: isSelected
          ? "0 4px 16px rgba(0, 0, 0, 0.5)"
          : "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.thumbnailDataUrl}
        alt={`${item.originalFileName} — ${item.aspectRatio}`}
        className="w-full h-full object-cover"
      />

      {/* Ratio badge */}
      <span
        className="absolute bottom-0 left-0 right-0 text-center py-1"
        style={{
          background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.03em",
          color: "rgba(255,255,255,0.85)",
          fontStretch: "75%",
        }}
      >
        {item.aspectRatio}
      </span>

      {/* Remove button */}
      {isHovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center cursor-pointer animate-fade-in"
          style={{
            borderRadius: "var(--radius-pill)",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            color: "white",
            fontSize: "11px",
            lineHeight: 1,
          }}
          aria-label={`Remove ${item.originalFileName}`}
        >
          &times;
        </button>
      )}
    </div>
  );
}

export function GalleryTray({
  items,
  selectedItemId,
  onSelect,
  onRemove,
  onClearAll,
}: GalleryTrayProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to end when new items are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [items.length]);

  const handleToggle = useCallback(() => setIsCollapsed((prev) => !prev), []);

  if (items.length === 0) return null;

  // Collapsed — just a small pill
  if (isCollapsed) {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={handleToggle}
          className="glass cursor-pointer transition-all duration-200"
          style={{
            borderRadius: "var(--radius-pill)",
            padding: "6px 14px",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
        >
          <span className="type-mono-small" style={{ color: "var(--text-secondary)" }}>
            {items.length} saved
          </span>
        </button>
      </div>
    );
  }

  // Expanded — floating glass tray at the bottom
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-40 animate-fade-in-up"
      style={{
        background: "linear-gradient(transparent, rgba(0, 0, 0, 0.3) 40%)",
        paddingTop: 24,
      }}
    >
      <div
        className="glass-shimmer mx-auto max-w-[800px] px-4"
        style={{
          background: "rgba(10, 10, 10, 0.5)",
          backdropFilter: "blur(32px) saturate(1.8) brightness(1.08)",
          WebkitBackdropFilter: "blur(32px) saturate(1.8) brightness(1.08)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          border: "1px solid rgba(255, 255, 255, 0.09)",
          borderBottom: "none",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 -8px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 pt-2.5 pb-1">
          <span className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
            {items.length} saved
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClearAll}
              className="type-mono-small cursor-pointer transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
            >
              Clear
            </button>
            <button
              onClick={handleToggle}
              className="type-mono-small cursor-pointer transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
            >
              Hide
            </button>
          </div>
        </div>

        {/* Thumbnails — horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex items-center gap-3 px-3 py-3 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {items.map((item) => (
            <TrayThumb
              key={item.id}
              item={item}
              isSelected={selectedItemId === item.id}
              onSelect={() => onSelect(item)}
              onRemove={() => onRemove(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
