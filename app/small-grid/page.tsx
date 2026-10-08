"use client";

import { Clock, DayOfWeek } from "@/components/clock";
import { useEffect, useState } from "react";

const imageUrl = (index: number) => `https://picsum.photos/300/200?random=${index}`;

export default function SmallGridPage() {
  const [images, setImages] = useState(() => Array.from({ length: 12 }, (_, index) => index));
  useEffect(() => { const timer = window.setInterval(() => setImages((current) => current.map((value, index) => index === Math.floor(Math.random() * current.length) ? value + 50 : value)), 15_000); return () => clearInterval(timer); }, []);
  return <main className="container" data-layout="main"><div><div className="clockpage"><a id="clock" href="/cloud-grid"><Clock /></a><span id="dayOfWeek"><DayOfWeek /></span></div><div id="photo-grid">{images.map((index) => <a className="cell" href={imageUrl(index)} key={index}><img src={imageUrl(index)} alt="Random image" /></a>)}</div></div></main>;
}
