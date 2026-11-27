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

export function Clock({ fixedDigits = false }: { fixedDigits?: boolean }) {
  const time = useSyncExternalStore(subscribeToClock, getLocalTime, () => "--:--");
  if (fixedDigits) {
    return (
      <time className="time-grid-time" dateTime={time === "--:--" ? undefined : time}>
        <span className="time-grid-time-label">{time}</span>
        <span className="time-grid-digits" aria-hidden="true">
          {[...time].map((character, position) => (
            <span key={position}>{character}</span>
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
