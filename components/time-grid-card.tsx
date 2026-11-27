import { Clock, CalendarDate } from "@/components/clock";
import type { TimeCard } from "@/components/time-grid-layout";

export function TimeGridCard({
  card, incomingPhoto, onSwapEnd,
}: {
  card: TimeCard;
  incomingPhoto?: string;
  onSwapEnd?: () => void;
}) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- Preserve document navigation for the offline service worker.
    <a
      className="cell time-grid-card"
      data-time-card={card}
      data-time-grid-swap={incomingPhoto ? "" : undefined}
      href="/"
      aria-description="Return to the home page"
      onAnimationEnd={(event) => {
        if (event.animationName === "image-crossfade-out") onSwapEnd?.();
      }}
    >
      {incomingPhoto && (
        <span className="time-grid-swap-photo" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- Reuse the preview already loaded by the grid. */}
          <img src={incomingPhoto} alt="" />
        </span>
      )}
      <TimeGridCardFace card={card} />
    </a>
  );
}

export function TimeGridCardFace({ card }: { card: TimeCard }) {
  return (
    <span className="time-grid-card-surface" data-card-face={card}>
      {card === "time" ? <Clock layout="digits" className="time-grid-time" /> : <CalendarDate />}
    </span>
  );
}
