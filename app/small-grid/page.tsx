import { Clock, DayOfWeek } from "@/components/clock";
import { SmallGridGallery } from "@/components/small-grid-gallery";
import { WeatherWidget } from "@/components/weather";
import { getWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

export default async function SmallGridPage() {
  const weather = await getWeather("Stockholm");

  return (
    <main className="container" data-layout="small-grid">
      <div>
        <div className="clockpage">
          <a id="clock" href="/cloud-grid">
            <Clock />
          </a>
          <span id="dayOfWeek">
            <DayOfWeek />
          </span>
        </div>
        <SmallGridGallery />
        <WeatherWidget initialWeather={weather} />
      </div>
    </main>
  );
}
