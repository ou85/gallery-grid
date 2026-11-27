"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationEvent } from "react";

type ImageFrame = {
  src: string;
  href: string;
};

type Props = ImageFrame & {
  alt: string;
  className: string;
  galleryModal?: boolean;
  onSettled?: (displayed: boolean) => void;
};

export function ImageCrossfade({ src, href, alt, className, galleryModal = false, onSettled }: Props) {
  const [current, setCurrent] = useState<ImageFrame>(() => ({ src, href }));
  const [incoming, setIncoming] = useState<ImageFrame | null>(null);
  const [transitionStarted, setTransitionStarted] = useState(false);
  const settleRef = useRef<((displayed: boolean) => void) | null>(null);

  useEffect(() => {
    if (src === current.src && href === current.href) return;

    let cancelled = false;
    let settled = false;
    let transitionQueued = false;
    let animationFrame: number | undefined;
    let timeout: number;
    const next = { src, href };
    const preload = new window.Image();

    setIncoming(null);
    setTransitionStarted(false);

    const settle = (displayed: boolean) => {
      if (cancelled || settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (displayed) setCurrent(next);
      setIncoming(null);
      setTransitionStarted(false);
      onSettled?.(displayed);
    };
    settleRef.current = settle;
    timeout = window.setTimeout(() => settle(false), 10_000);

    const startTransition = () => {
      if (cancelled || settled || transitionQueued) return;
      transitionQueued = true;
      setIncoming(next);
      animationFrame = window.requestAnimationFrame(() => {
        if (cancelled || settled) return;
        setTransitionStarted(true);
        window.clearTimeout(timeout);
        timeout = window.setTimeout(() => settle(true), 1_000);
      });
    };

    preload.onload = startTransition;
    preload.onerror = () => settle(false);
    preload.src = src;

    if (preload.complete && preload.naturalWidth > 0) startTransition();

    return () => {
      cancelled = true;
      settleRef.current = null;
      preload.onload = null;
      preload.onerror = null;
      window.clearTimeout(timeout);
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [src, href, current.src, current.href, onSettled]);

  const finishTransition = (event: AnimationEvent<HTMLImageElement>) => {
    if (event.animationName === "image-crossfade-in") settleRef.current?.(true);
  };

  return (
    <a className={className} href={incoming?.href ?? current.href} data-gallery-image={galleryModal ? "true" : undefined} target="_blank" rel="noreferrer">
      <img
        className={`image-transition-layer ${incoming ? "image-transition-outgoing" : "image-transition-current"} ${transitionStarted ? "is-active" : ""}`}
        src={current.src}
        alt={alt}
      />
      {incoming && (
        <img
          className={`image-transition-layer image-transition-incoming ${transitionStarted ? "is-active" : ""}`}
          src={incoming.src}
          alt={alt}
          onError={() => settleRef.current?.(false)}
          onAnimationEnd={finishTransition}
        />
      )}
    </a>
  );
}
