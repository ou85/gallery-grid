"use client";

import { useSyncExternalStore } from "react";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function subscribeToClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 1_000);
  return () => window.clearInterval(timer);
}

function getLocalTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function Clock({ layout, className }: { layout?: "digits" | "groups"; className?: string }) {
  const time = useSyncExternalStore(subscribeToClock, getLocalTime, () => "--:--");
  if (layout) {
    const parts = layout === "digits" ? [...time] : [time.slice(0, 2), ":", time.slice(3)];
    return (
      <time className={className} dateTime={time === "--:--" ? undefined : time}>
        <span className="clock-label">{time}</span>
        <span className="clock-display" data-clock-layout={layout} aria-hidden="true">
          {parts.map((part, position) => (
            <span key={position}>{part}</span>
          ))}
        </span>
      </time>
    );
  }
  return <>{time}</>;
}

export function DayOfWeek() {
  const day = useSyncExternalStore(
    subscribeToClock,
    () => dayNames[new Date().getDay()],
    () => "—",
  );
  return <>{day}</>;
}

export function CalendarDate() {
  const dayStart = useSyncExternalStore(
    subscribeToClock,
    () => new Date().setHours(0, 0, 0, 0),
    () => null,
  );
  const date = dayStart === null ? null : new Date(dayStart);

  return (
    <span className="time-grid-date">
      <span className="time-grid-weekday">{date ? dayNames[date.getDay()] : "—"}</span>
      <span className="time-grid-date-label">{date ? dateFormat.format(date) : "—"}</span>
    </span>
  );
}
