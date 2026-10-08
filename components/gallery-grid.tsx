"use client";

import { useEffect, useRef, useState } from "react";
import { ImageDeck } from "@/components/image-deck";
import type { GalleryImage } from "@/lib/gallery-assets";

type Props = { images: GalleryImage[]; size: number; refreshMs: number; thumbnail?: boolean };

export function GalleryGrid({ images, size, refreshMs, thumbnail = false }: Props) {
  const deck = useRef<ImageDeck | null>(null);
  const [visible, setVisible] = useState<GalleryImage[]>([]);

  useEffect(() => {
    const nextDeck = new ImageDeck(images);
    deck.current = nextDeck;
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
        const next = deck.current.next(current.filter((_, currentIndex) => currentIndex !== index).map(({ id }) => id));
        return current.map((image, currentIndex) => currentIndex === index ? next : image);
      });
    }, refreshMs);
    return () => window.clearInterval(timer);
  }, [refreshMs]);

  return <div id="photo-grid" className={thumbnail ? "cloud-grid" : ""}>
    {visible.map((image) => <a className="cell" href={image.originalUrl} key={image.id} target="_blank" rel="noreferrer">
      <img className="fade-in" src={thumbnail ? image.thumbnailUrl : image.originalUrl} alt="Gallery image" />
    </a>)}
  </div>;
}
