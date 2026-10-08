import { Clock, DayOfWeek } from "@/components/clock";
import { GalleryGrid } from "@/components/gallery-grid";
import { WeatherWidget } from "@/components/weather";
import { getGalleryImages } from "@/lib/gallery-assets";
import { getWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

export default async function CloudGridPage() {
  const [images, weather] = await Promise.all([getGalleryImages(), getWeather("Stockholm")]);
  return <main className="container" data-layout="cloud"><div className="cloud-content"><div className="clockpage"><a id="clock" href="/list" style={{ fontSize: "3.5rem" }}><Clock /></a><span id="dayOfWeek"><DayOfWeek /></span></div><GalleryGrid images={images} size={12} refreshMs={15_000} thumbnail /><div id="error-message" /><WeatherWidget initialWeather={weather} /></div></main>;
}
