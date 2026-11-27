"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GalleryRotation } from "@/components/image-deck";
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
  const rotation = useRef<GalleryRotation | null>(null);
  const [{ frames, pending }, setSnapshot] = useState<ReturnType<GalleryRotation["snapshot"]>>({
    frames: [],
    pending: undefined,
  });

  const onSettled = useMemo(() => {
    if (!pending) return undefined;
    return (displayed: boolean) => {
      const current = rotation.current;
      if (current?.settle(pending, displayed, performance.now())) {
        setSnapshot(current.snapshot());
      }
    };
  }, [pending]);

  useEffect(() => {
    // Match the two-column range of the home grid in globals.css.
    const twoColumns = twoColumnSize === undefined
      ? undefined
      : window.matchMedia("(360px < width <= 640px)");

    const current = new GalleryRotation(images);
    rotation.current = current;
    const updateGrid = () => {
      const count = twoColumns?.matches ? twoColumnSize ?? size : size;
      current.resize(Math.min(count, images.length), performance.now());
      setSnapshot(current.snapshot());
    };

    console.log(`Images in rotation: ${images.length}`);
    updateGrid();
    twoColumns?.addEventListener("change", updateGrid);
    return () => {
      twoColumns?.removeEventListener("change", updateGrid);
      rotation.current = null;
    };
  }, [images, size, twoColumnSize]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden || document.querySelector("dialog.image-lightbox[open]")) return;
      const current = rotation.current;
      if (current?.advance(performance.now())) setSnapshot(current.snapshot());
    }, refreshMs);
    return () => window.clearInterval(timer);
  }, [refreshMs]);

  return (
    <div id="photo-grid" className={thumbnail ? "cloud-grid" : ""}>
      {frames.map((image, index) => (
        <ImageCrossfade
          key={index}
          className="cell image-crossfade"
          src={image.thumbnailUrl}
          href={image.originalUrl}
          alt="Gallery image"
          galleryModal
          onSettled={pending?.index === index ? onSettled : undefined}
        />
      ))}
    </div>
  );
}
