"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationEvent, ReactNode } from "react";

type ImageFrame = {
  src: string;
  href: string;
};

type Props = ImageFrame & {
  alt: string;
  className: string;
  galleryModal?: boolean;
  onSettled?: (displayed: boolean) => void;
  swapOverlay?: ReactNode;
};

export function ImageCrossfade({ src, href, alt, className, galleryModal = false, onSettled, swapOverlay }: Props) {
  const [current, setCurrent] = useState<ImageFrame>(() => ({ src, href }));
  const [loaded, setLoaded] = useState<ImageFrame | null>(null);
  const settleRef = useRef<{ frame: ImageFrame; settle: (displayed: boolean) => void } | null>(null);
  const incoming = loaded?.src === src && loaded.href === href ? loaded : null;

  useEffect(() => {
    if (src === current.src && href === current.href) return;

    let cancelled = false;
    let settled = false;
    let timeout: number;
    const next = { src, href };
    const preload = new window.Image();

    const settle = (displayed: boolean) => {
      if (cancelled || settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (displayed) setCurrent(next);
      setLoaded(null);
      onSettled?.(displayed);
    };
    settleRef.current = { frame: next, settle };
    timeout = window.setTimeout(() => settle(false), 10_000);

    preload.onload = () => {
      if (cancelled || settled) return;
      setLoaded(next);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => settle(true), 1_000);
    };
    preload.onerror = () => settle(false);
    preload.src = src;

    return () => {
      cancelled = true;
      settleRef.current = null;
      preload.onload = null;
      preload.onerror = null;
      window.clearTimeout(timeout);
    };
  }, [src, href, current.src, current.href, onSettled]);

  const finishTransition = (frame: ImageFrame, displayed: boolean) => {
    const pending = settleRef.current;
    if (pending?.frame === frame) pending.settle(displayed);
  };

  return (
    <a
      className={className}
      href={incoming?.href ?? current.href}
      data-gallery-image={galleryModal ? "true" : undefined}
      data-time-grid-swap={swapOverlay ? "" : undefined}
      target="_blank"
      rel="noreferrer"
    >
      <img
        className={`image-transition-layer ${incoming ? "image-transition-outgoing is-active" : "image-transition-current"}`}
        src={current.src}
        alt={alt}
      />
      {incoming && (
        <img
          key={incoming.src}
          className="image-transition-layer image-transition-incoming is-active"
          src={incoming.src}
          alt={alt}
          onError={() => finishTransition(incoming, false)}
          onAnimationEnd={(event: AnimationEvent<HTMLImageElement>) => {
            if (event.animationName === "image-crossfade-in") finishTransition(incoming, true);
          }}
        />
      )}
      {swapOverlay}
    </a>
  );
}
