"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getGalleryItems,
  saveGalleryItem,
  removeGalleryItem,
  clearGallery,
} from "@/lib/gallery-storage";
import type { GalleryItem } from "@/types";

interface UseGalleryReturn {
  items: GalleryItem[];
  addItem: (item: Omit<GalleryItem, "id" | "createdAt">) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  selectItem: (item: GalleryItem | null) => void;
  selectedItem: GalleryItem | null;
}

export function useGallery(): UseGalleryReturn {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Load from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    setItems(getGalleryItems());
  }, []);

  const addItem = useCallback(
    (data: Omit<GalleryItem, "id" | "createdAt">) => {
      const item: GalleryItem = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      saveGalleryItem(item);
      setItems(getGalleryItems());
    },
    []
  );

  const removeItem = useCallback(
    (id: string) => {
      removeGalleryItem(id);
      setItems(getGalleryItems());
      // Deselect if the removed item was selected
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    },
    [selectedItem]
  );

  const clearAll = useCallback(() => {
    clearGallery();
    setItems([]);
    setSelectedItem(null);
  }, []);

  const selectItem = useCallback((item: GalleryItem | null) => {
    setSelectedItem(item);
  }, []);

  return {
    items,
    addItem,
    removeItem,
    clearAll,
    selectItem,
    selectedItem,
  };
}
