import { Clock, DayOfWeek } from "@/components/clock";
import { GalleryGrid } from "@/components/gallery-grid";
import { WeatherWidget } from "@/components/weather";
import { getGalleryImages } from "@/lib/gallery-assets";

export const dynamic = "force-dynamic";

export default async function CloudGridPage() {
  const images = await getGalleryImages();

  return (
    <main className="container" data-layout="cloud">
      <div className="cloud-content">
        <div className="clockpage">
          <a id="clock" className="cloud-grid-clock" href="/time-grid">
            <Clock layout="groups" />
          </a>
          <a id="dayOfWeek" href="/list">
            <DayOfWeek />
          </a>
        </div>
        <GalleryGrid images={images} size={12} refreshMs={15_000} thumbnail />
        <div id="error-message" />
        <WeatherWidget />
      </div>
    </main>
  );
}
