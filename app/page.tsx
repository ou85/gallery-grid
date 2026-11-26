import { Clock, DayOfWeek } from "@/components/clock";
import { GalleryGrid } from "@/components/gallery-grid";
import { WeatherWidget } from "@/components/weather";
import { getGalleryImages } from "@/lib/gallery-assets";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const images = await getGalleryImages();

  return (
    <main className="container" data-layout="main">
      <div>
        <div className="clockpage">
          <a id="clock" href="/small-grid">
            <Clock />
          </a>
          <span id="dayOfWeek">
            <DayOfWeek />
          </span>
        </div>
        <GalleryGrid images={images} size={9} twoColumnSize={8} refreshMs={30_000} />
        <WeatherWidget />
      </div>
    </main>
  );
}
