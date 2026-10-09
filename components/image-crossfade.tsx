"use client";

import { useEffect, useState } from "react";
import type { AnimationEvent } from "react";

type ImageFrame = {
  src: string;
  href: string;
};

type Props = ImageFrame & {
  alt: string;
  className: string;
};

export function ImageCrossfade({ src, href, alt, className }: Props) {
  const [current, setCurrent] = useState<ImageFrame>(() => ({ src, href }));
  const [incoming, setIncoming] = useState<ImageFrame | null>(null);
  const [transitionStarted, setTransitionStarted] = useState(false);

  useEffect(() => {
    if (src === current.src && href === current.href) return;

    let cancelled = false;
    let transitionQueued = false;
    let animationFrame: number | undefined;
    const next = { src, href };
    const preload = new window.Image();

    setIncoming(null);
    setTransitionStarted(false);

    const startTransition = () => {
      if (cancelled || transitionQueued) return;
      transitionQueued = true;
      setIncoming(next);
      animationFrame = window.requestAnimationFrame(() => {
        if (!cancelled) setTransitionStarted(true);
      });
    };

    preload.onload = startTransition;
    preload.src = src;

    if (preload.complete && preload.naturalWidth > 0) startTransition();

    return () => {
      cancelled = true;
      preload.onload = null;
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [src, href, current.src, current.href]);

  const finishTransition = (event: AnimationEvent<HTMLImageElement>) => {
    if (event.animationName !== "image-crossfade-in" || !incoming) return;
    setCurrent(incoming);
    setIncoming(null);
    setTransitionStarted(false);
  };

  return (
    <a className={className} href={incoming?.href ?? current.href} target="_blank" rel="noreferrer">
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
          onAnimationEnd={finishTransition}
        />
      )}
    </a>
  );
}
