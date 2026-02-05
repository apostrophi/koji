"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { GalleryItem, AspectRatio } from "@/types";

interface GallerySheetProps {
  items: GalleryItem[];
  selectedItemId: string | null;
  onSelect: (item: GalleryItem) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}

function getCardRatio(aspectRatio: AspectRatio): number {
  const [w, h] = aspectRatio.split(":").map(Number);
  return w / h;
}

// ─── Card ────────────────────────────────────────────────────────────────────

function GalleryCard({
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
  const ratio = getCardRatio(item.aspectRatio);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative cursor-pointer focus-visible:outline-none"
      style={{
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        outline: isSelected
          ? "2px solid rgba(255, 255, 255, 0.4)"
          : "2px solid transparent",
        outlineOffset: 2,
        transform: isSelected ? "scale(1.02)" : isHovered ? "scale(1.01)" : "none",
        transition: "transform 200ms ease, outline-color 150ms ease",
      }}
    >
      {/* Image at natural aspect ratio */}
      <div style={{ aspectRatio: String(ratio), width: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnailDataUrl}
          alt={`${item.originalFileName} — ${item.aspectRatio}`}
          className="w-full h-full"
          style={{ objectFit: "cover", display: "block" }}
        />
      </div>

      {/* Remove button — hover only */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center cursor-pointer animate-fade-in"
          style={{
            borderRadius: "var(--radius-pill)",
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            color: "rgba(255, 255, 255, 0.9)",
            fontSize: "11px",
            lineHeight: 1,
          }}
          aria-label={`Remove ${item.originalFileName}`}
        >
          &times;
        </button>
      )}

      {/* Metadata below image */}
      <div
        className="px-2 py-1.5"
        style={{ pointerEvents: "none" }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "9.5px",
            letterSpacing: "0.03em",
            color: "var(--text-tertiary)",
            lineHeight: 1.3,
          }}
        >
          {item.aspectRatio}
          <span style={{ opacity: 0.4 }}> &middot; </span>
          {item.resolution}
        </p>
      </div>
    </div>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

export function GallerySheet({
  items,
  selectedItemId,
  onSelect,
  onRemove,
  onClearAll,
  onOpenChange,
}: GallerySheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(items.length);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  }, [onOpenChange]);

  const close = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  // Auto-scroll to top when a new item is added
  useEffect(() => {
    if (items.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevCountRef.current = items.length;
  }, [items.length]);

  if (items.length === 0) return null;

  // ── Collapsed pill ──
  if (!isOpen) {
    return (
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
        <button
          onClick={toggle}
          className="glass cursor-pointer transition-all duration-200"
          style={{
            borderRadius: "var(--radius-pill)",
            padding: "7px 18px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "";
          }}
        >
          <span
            className="type-mono-small"
            style={{ color: "var(--text-secondary)" }}
          >
            {items.length} {items.length === 1 ? "image" : "images"}
          </span>
        </button>
      </div>
    );
  }

  // ── Right panel ──
  return (
    <aside
      className="fixed top-0 right-0 bottom-0 z-40 flex flex-col"
      style={{
        width: 260,
        background: "rgba(10, 10, 10, 0.65)",
        backdropFilter: "blur(40px) saturate(1.4) brightness(1.04)",
        WebkitBackdropFilter: "blur(40px) saturate(1.4) brightness(1.04)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.07)",
        boxShadow: "-8px 0 40px rgba(0, 0, 0, 0.4)",
        animation: "panel-in-right 300ms cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}
      >
        <span
          className="type-mono-small"
          style={{ color: "var(--text-tertiary)" }}
        >
          {items.length} {items.length === 1 ? "image" : "images"}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={onClearAll}
            className="type-mono-small cursor-pointer transition-colors duration-200"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
            }}
          >
            Clear
          </button>
          <button
            onClick={close}
            className="cursor-pointer transition-colors duration-200 flex items-center justify-center"
            style={{
              color: "var(--text-tertiary)",
              fontSize: "16px",
              width: 24,
              height: 24,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
            }}
            aria-label="Close gallery"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Cards — single column, vertical scroll */}
      <div
        ref={scrollRef}
        className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {items.map((item) => (
          <GalleryCard
            key={item.id}
            item={item}
            isSelected={selectedItemId === item.id}
            onSelect={() => onSelect(item)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </div>
    </aside>
  );
}
