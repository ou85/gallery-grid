import { Clock, DayOfWeek } from "@/components/clock";
import { SmallGridGallery } from "@/components/small-grid-gallery";
import { WeatherWidget } from "@/components/weather";

export default function SmallGridPage() {
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
        <WeatherWidget />
      </div>
    </main>
  );
}
