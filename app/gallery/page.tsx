import { getCloudinaryGalleryImages } from "@/lib/gallery-assets";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const images = await getCloudinaryGalleryImages();

  return (
    <main className="container" data-layout="list">
      <div className="list-shell">
        <header className="list-header">
          <div className="list-header-content">
            <a className="home-link" href="/">
              Home
            </a>
            <p>Gallery: {images.length}</p>
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
