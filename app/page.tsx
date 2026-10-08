import { Clock, DayOfWeek } from "@/components/clock";
import { GalleryGrid } from "@/components/gallery-grid";
import { WeatherWidget } from "@/components/weather";
import { getLegacyImages } from "@/lib/gallery-assets";
import { getWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [images, weather] = await Promise.all([getLegacyImages(), getWeather("Stockholm")]);
  return <main className="container" data-layout="main"><div><div className="clockpage"><a id="clock" href="/small-grid"><Clock /></a><span id="dayOfWeek"><DayOfWeek /></span></div><GalleryGrid images={images} size={9} refreshMs={30_000} /><WeatherWidget initialWeather={weather} /></div></main>;
}
