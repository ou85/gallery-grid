import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery-grid";
import { WeatherWidget } from "@/components/weather";
import { getGalleryImages } from "@/lib/gallery-assets";

export const metadata: Metadata = { title: "Time Grid | Gallery" };
export const dynamic = "force-dynamic";

export default async function TimeGridPage() {
  const images = await getGalleryImages();

  return (
    <main className="container time-grid-page" data-layout="cloud">
      <div className="cloud-content">
        <GalleryGrid images={images} size={10} refreshMs={15_000} timeCards />
        <WeatherWidget />
      </div>
    </main>
  );
}
