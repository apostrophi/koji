"use client";

import { useState, useCallback } from "react";
import type { GalleryItem } from "@/types";

interface GallerySidebarProps {
  items: GalleryItem[];
  selectedItemId: string | null;
  onSelect: (item: GalleryItem) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

function ThumbnailCard({
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
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full overflow-hidden cursor-pointer transition-all duration-200 focus-visible:outline-none"
      style={{
        borderRadius: "var(--radius-sm)",
        transform: isSelected ? "scale(1.02)" : isHovered ? "scale(1.01)" : "none",
        boxShadow: isSelected
          ? "0 4px 16px rgba(0, 0, 0, 0.4)"
          : isHovered
            ? "0 2px 8px rgba(0, 0, 0, 0.3)"
            : "none",
      }}
      title={`${item.originalFileName} — ${item.aspectRatio} at ${item.resolution}`}
    >
      <div className="aspect-square overflow-hidden" style={{ borderRadius: "var(--radius-sm)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnailDataUrl}
          alt={`${item.originalFileName} resized to ${item.aspectRatio}`}
          className="w-full h-full object-cover"
        />
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-1.5 py-1"
        style={{
          background: "linear-gradient(transparent, rgba(0,0,0,0.45))",
          borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
        }}
      >
        <span className="type-mono-small text-white">{item.aspectRatio}</span>
        <span className="type-mono-small text-white/60">{item.resolution}</span>
      </div>

      {isHovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center cursor-pointer animate-fade-in"
          style={{
            borderRadius: "var(--radius-pill)",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            color: "white",
            fontSize: "11px",
          }}
          aria-label={`Remove ${item.originalFileName}`}
        >
          &times;
        </button>
      )}
    </button>
  );
}

export function GallerySidebar({
  items,
  selectedItemId,
  onSelect,
  onRemove,
  onClearAll,
}: GallerySidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const handleToggle = useCallback(() => setIsExpanded((prev) => !prev), []);

  if (!isExpanded) {
    return (
      <div
        className="hidden md:flex flex-col items-center w-8 flex-shrink-0"
        style={{ borderLeft: "1px solid rgba(255, 255, 255, 0.04)" }}
      >
        <button
          onClick={handleToggle}
          className="py-3 cursor-pointer -rotate-90 whitespace-nowrap transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
        >
          <span className="type-mono-small">
            {items.length > 0 ? items.length : ""}
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className="hidden md:flex flex-col w-[220px] flex-shrink-0 animate-fade-in"
      style={{
        borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}
      >
        <span className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
          {items.length > 0 ? `${items.length} saved` : "Library"}
        </span>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={onClearAll}
              className="type-mono-small cursor-pointer transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
            >
              Clear
            </button>
          )}
          <button
            onClick={handleToggle}
            className="type-mono-small cursor-pointer transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
          >
            &rarr;
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="type-mono-small" style={{ color: "var(--text-tertiary)" }}>
              Generations appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {items.map((item) => (
              <ThumbnailCard
                key={item.id}
                item={item}
                isSelected={selectedItemId === item.id}
                onSelect={() => onSelect(item)}
                onRemove={() => onRemove(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
