"use client";

import { useEffect, useRef, useState } from "react";
import { ImageDeck } from "@/components/image-deck";
import { ImageCrossfade } from "@/components/image-crossfade";
import type { GalleryImage } from "@/lib/gallery-assets";

type Props = {
  images: GalleryImage[];
  size: number;
  twoColumnSize?: number;
  refreshMs: number;
  thumbnail?: boolean;
};

export function GalleryGrid({ images, size, twoColumnSize, refreshMs, thumbnail = false }: Props) {
  const deck = useRef<ImageDeck | null>(null);
  const [visible, setVisible] = useState<GalleryImage[]>([]);

  useEffect(() => {
    // Match the two-column range of the home grid in globals.css.
    const twoColumns = twoColumnSize === undefined
      ? undefined
      : window.matchMedia("(360px < width <= 640px)");

    const updateGrid = () => {
      const nextDeck = new ImageDeck(images);
      deck.current = nextDeck;
      const count = twoColumns?.matches ? twoColumnSize ?? size : size;
      setVisible(Array.from({ length: Math.min(count, images.length) }, () => nextDeck.next()));
    };

    console.log(`Images in rotation: ${images.length}`);
    updateGrid();
    twoColumns?.addEventListener("change", updateGrid);
    return () => twoColumns?.removeEventListener("change", updateGrid);
  }, [images, size, twoColumnSize]);

  useEffect(() => {
    let lastIndex = -1;
    const timer = window.setInterval(() => {
      if (document.hidden || document.querySelector("dialog.image-lightbox[open]")) return;
      setVisible((current) => {
        if (!deck.current || current.length < 2) return current;

        let index = Math.floor(Math.random() * current.length);
        if (index === lastIndex) index = (index + 1) % current.length;
        lastIndex = index;

        const excludedIds = current
          .filter((_, currentIndex) => currentIndex !== index)
          .map(({ id }) => id);
        const nextImage = deck.current.next(excludedIds);

        return current.map((image, currentIndex) =>
          currentIndex === index ? nextImage : image,
        );
      });
    }, refreshMs);
    return () => window.clearInterval(timer);
  }, [refreshMs]);

  return (
    <div id="photo-grid" className={thumbnail ? "cloud-grid" : ""}>
      {visible.map((image, index) => (
        <ImageCrossfade
          key={index}
          className="cell image-crossfade"
          src={image.thumbnailUrl}
          href={image.originalUrl}
          alt="Gallery image"
          galleryModal
        />
      ))}
    </div>
  );
}
