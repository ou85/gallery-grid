"use client";

import { useEffect, useRef, useState } from "react";
import { ImageDeck } from "@/components/image-deck";
import { ImageCrossfade } from "@/components/image-crossfade";
import type { GalleryImage } from "@/lib/gallery-assets";

type Props = {
  images: GalleryImage[];
  size: number;
  refreshMs: number;
  thumbnail?: boolean;
};

export function GalleryGrid({ images, size, refreshMs, thumbnail = false }: Props) {
  const deck = useRef<ImageDeck | null>(null);
  const [visible, setVisible] = useState<GalleryImage[]>([]);

  useEffect(() => {
    const nextDeck = new ImageDeck(images);
    deck.current = nextDeck;
    console.log(`Images in rotation: ${images.length}`);
    setVisible(Array.from({ length: Math.min(size, images.length) }, () => nextDeck.next()));
  }, [images, size]);

  useEffect(() => {
    let lastIndex = -1;
    const timer = window.setInterval(() => {
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
          src={thumbnail ? image.thumbnailUrl : image.originalUrl}
          href={image.originalUrl}
          alt="Gallery image"
        />
      ))}
    </div>
  );
}
