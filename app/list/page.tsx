import { getCloudinaryGalleryImages, getGalleryImages } from "@/lib/gallery-assets";
import { RotationCount } from "@/components/rotation-count";

export const dynamic = "force-dynamic";

export default async function ListPage() {
  const [images, cloudImages] = await Promise.all([getGalleryImages(), getCloudinaryGalleryImages()]);

  return (
    <main className="container" data-layout="list">
      <RotationCount count={images.length} />
      <div className="list-shell">
        <header className="list-header">
          <div className="list-header-content">
            <a className="home-link" href="/cloud-grid">
              <i className="fas fa-arrow-left" aria-hidden="true" />{" "}
              Back
            </a>
            <p>
              {images.length} photos total (including {cloudImages.length} in{" "}
              <a href="/gallery">Gallery</a>)
            </p>
          </div>
        </header>
        <div className="list-content">
          <div id="photo-grid">
            {images.map((image) => (
              <a
                key={image.id}
                href={image.originalUrl}
                target="_blank"
                rel="noreferrer"
              >
                <img src={image.originalUrl} alt="Gallery image" />
              </a>
            ))}
          </div>
          <div className="list-year">
            <h3>2026</h3>
          </div>
        </div>
      </div>
    </main>
  );
}
