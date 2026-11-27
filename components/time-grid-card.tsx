import { Clock, CalendarDate } from "@/components/clock";
import type { TimeCard } from "@/components/time-grid-layout";

export function TimeGridCard({
  card, position, arriving, onDeparted,
}: {
  card: TimeCard;
  position: number;
  arriving: boolean;
  onDeparted?: () => void;
}) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- Preserve document navigation for the offline service worker.
    <a className="cell time-grid-card" data-time-card={card} href="/" aria-description="Return to the home page">
      <span
        key={position}
        className="time-grid-card-surface"
        data-arriving={arriving ? "" : undefined}
        data-departing={onDeparted ? "" : undefined}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && event.animationName === "image-crossfade-out") {
            onDeparted?.();
          }
        }}
      >
        {card === "time"
          ? <span className="time-grid-time"><Clock /></span>
          : <CalendarDate />}
      </span>
    </a>
  );
}
