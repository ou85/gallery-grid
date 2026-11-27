"use client";

import { useSyncExternalStore } from "react";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

export function Clock() {
  const time = useSyncExternalStore(subscribeToClock, getLocalTime, () => "--:--");
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
