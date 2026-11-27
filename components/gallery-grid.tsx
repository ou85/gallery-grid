"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { GalleryRotation } from "@/components/image-deck";
import { ImageCrossfade } from "@/components/image-crossfade";
import { TimeGridCard } from "@/components/time-grid-card";
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

type CardMove = { card: TimeCard; destination: number };

export function GalleryGrid({ images, size, twoColumnSize, refreshMs, thumbnail = false, timeCards = false }: Props) {
  const rotation = useRef<GalleryRotation | null>(null);
  const [{ frames, pending }, setSnapshot] = useState<ReturnType<GalleryRotation["snapshot"]>>({
    frames: [],
    pending: undefined,
  });
  const [timeGrid, setTimeGrid] = useState<{
    cells: TimeGridCell[];
    arrivingCard?: TimeCard;
    departure?: CardMove;
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

  const finishCardDeparture = useCallback((move: CardMove) => {
    setTimeGrid((grid) => grid.departure === move
      ? { cells: moveTimeCard(grid.cells, move.card, move.destination), arrivingCard: move.card }
      : grid);
  }, []);

  const departure = timeGrid.departure;
  useEffect(() => {
    if (!departure) return;
    // Finish the swap even if the browser cancels the outgoing animation.
    const timer = window.setTimeout(() => finishCardDeparture(departure), 850);
    return () => window.clearTimeout(timer);
  }, [departure, finishCardDeparture]);

  const tick = useEffectEvent(() => {
    if (document.hidden || document.querySelector("dialog.image-lightbox[open]")) return;
    const current = rotation.current;
    if (!current || departure) return;
    if (timeCards) {
      const { frames, pending } = current.snapshot();
      if (pending) return;
      const event = Math.random();
      if (frames.length && event < 0.4) {
        const card = event < 0.2 ? "time" : "date";
        const destination = Math.random();
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setTimeGrid(({ cells }) => reducedMotion
          ? { cells: moveTimeCard(cells, card, destination) }
          : { cells, departure: { card, destination } });
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
      />
    );
  };

  return (
    <div id="photo-grid" className={thumbnail ? "cloud-grid" : ""}>
      {timeCards
        ? timeGrid.cells.map((cell, position) => typeof cell === "number" ? renderPhoto(cell) : (
          <TimeGridCard
            key={cell}
            card={cell}
            position={position}
            arriving={timeGrid.arrivingCard === cell}
            onDeparted={departure?.card === cell ? () => finishCardDeparture(departure) : undefined}
          />
        ))
        : frames.map((_, index) => renderPhoto(index))}
    </div>
  );
}
