import { Clock, CalendarDate } from "@/components/clock";
import type { TimeCard } from "@/components/time-grid-layout";

export function TimeGridCard({ card }: { card: TimeCard }) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- Preserve document navigation for the offline service worker.
    <a className="cell time-grid-card" data-time-card={card} href="/" aria-description="Return to the home page">
      {card === "time"
        ? <span className="time-grid-time"><Clock /></span>
        : <CalendarDate />}
    </a>
  );
}
