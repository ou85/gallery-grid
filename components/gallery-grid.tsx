"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { GalleryRotation } from "@/components/image-deck";
import { ImageCrossfade } from "@/components/image-crossfade";
import { TimeGridCard, TimeGridCardFace } from "@/components/time-grid-card";
import { createTimeGridCells, moveTimeCard } from "@/components/time-grid-layout";
import type { TimeCard, TimeGridCell } from "@/components/time-grid-layout";
import type { GalleryImage } from "@/lib/gallery-assets";

type Props = {
  images: GalleryImage[];
  size: number;
  twoColumnSize?: number;
  refreshMs: number;
  thumbnail?: boolean;
  timeCards?: boolean;
};

type CardSwap = { card: TimeCard; photoSlot: number; nextCells: TimeGridCell[] };

export function GalleryGrid({ images, size, twoColumnSize, refreshMs, thumbnail = false, timeCards = false }: Props) {
  const rotation = useRef<GalleryRotation | null>(null);
  const [{ frames, pending }, setSnapshot] = useState<ReturnType<GalleryRotation["snapshot"]>>({
    frames: [],
    pending: undefined,
  });
  const [timeGrid, setTimeGrid] = useState<{
    cells: TimeGridCell[];
    swap?: CardSwap;
  }>({
    cells: ["time", "date"],
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
      const snapshot = current.snapshot();
      setSnapshot(snapshot);
      if (timeCards) setTimeGrid({ cells: createTimeGridCells(snapshot.frames.length) });
    };

    console.log(`Images in rotation: ${images.length}`);
    updateGrid();
    twoColumns?.addEventListener("change", updateGrid);
    return () => {
      twoColumns?.removeEventListener("change", updateGrid);
      rotation.current = null;
    };
  }, [images, size, twoColumnSize, timeCards]);

  const finishCardSwap = useCallback((swap: CardSwap) => {
    setTimeGrid((grid) => grid.swap === swap ? { cells: swap.nextCells } : grid);
  }, []);

  const swap = timeGrid.swap;
  useEffect(() => {
    if (!swap) return;
    // Finish the swap even if the browser cancels the outgoing animation.
    const timer = window.setTimeout(() => finishCardSwap(swap), 850);
    return () => window.clearTimeout(timer);
  }, [swap, finishCardSwap]);

  const tick = useEffectEvent(() => {
    if (document.hidden || document.querySelector("dialog.image-lightbox[open]")) return;
    const current = rotation.current;
    if (!current || swap) return;
    if (timeCards) {
      const { frames, pending } = current.snapshot();
      if (pending) return;
      const event = Math.random();
      if (frames.length && event < 0.4) {
        const card = event < 0.2 ? "time" : "date";
        const destination = Math.random();
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setTimeGrid((grid) => {
          if (grid.swap) return grid;
          const nextCells = moveTimeCard(grid.cells, card, destination);
          const photoSlot = grid.cells[nextCells.indexOf(card)];
          if (typeof photoSlot !== "number") return grid;
          if (reducedMotion) return { cells: nextCells };
          return { cells: grid.cells, swap: { card, photoSlot, nextCells } };
        });
        return;
      }
    }
    if (current.advance(performance.now())) setSnapshot(current.snapshot());
  });

  useEffect(() => {
    const timer = window.setInterval(() => tick(), refreshMs);
    return () => window.clearInterval(timer);
  }, [refreshMs]);

  const renderPhoto = (index: number) => {
    const image = frames[index];
    if (!image) return null;
    return (
      <ImageCrossfade
        key={index}
        className="cell image-crossfade"
        src={image.thumbnailUrl}
        href={image.originalUrl}
        alt="Gallery image"
        galleryModal
        onSettled={pending?.index === index ? onSettled : undefined}
        swapOverlay={swap?.photoSlot === index ? (
          <span className="time-grid-swap-card" aria-hidden="true">
            <TimeGridCardFace card={swap.card} />
          </span>
        ) : undefined}
      />
    );
  };

  return (
    <div id="photo-grid" className={thumbnail ? "cloud-grid" : ""}>
      {timeCards
        ? timeGrid.cells.map((cell) => typeof cell === "number" ? renderPhoto(cell) : (
          <TimeGridCard
            key={cell}
            card={cell}
            incomingPhoto={swap?.card === cell ? frames[swap.photoSlot]?.thumbnailUrl : undefined}
            onSwapEnd={swap?.card === cell ? () => finishCardSwap(swap) : undefined}
          />
        ))
        : frames.map((_, index) => renderPhoto(index))}
    </div>
  );
}
