"use client";

import { useEffect, useState } from "react";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const getNow = () => new Date();

export function Clock() {
  const [now, setNow] = useState(getNow);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(getNow()), 1_000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const time = `${hours}:${minutes}`;

  return <>{time}</>;
}

export function DayOfWeek() {
  const [now, setNow] = useState(getNow);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(getNow()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return <>{dayNames[now.getDay()]}</>;
}
