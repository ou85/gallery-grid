import { getGalleryCatalogue } from "@/lib/gallery-assets";
import { paginateGallery } from "@/lib/gallery-pagination";
import { RotationCount } from "@/components/rotation-count";

export const dynamic = "force-dynamic";

const listPageUrl = (page: number) => page === 1 ? "/list" : `/list?page=${page}`;

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const [{ images, cloudCount }, params] = await Promise.all([getGalleryCatalogue(), searchParams]);
  const { page, totalPages, items } = paginateGallery(images, params.page);

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
              {images.length} photos total (including {cloudCount} in{" "}
              <a href="/gallery">Gallery</a>)
            </p>
          </div>
        </header>
        <div className="list-content">
          <div id="photo-grid">
            {items.map((image) => (
              <a
                key={image.id}
                href={image.originalUrl}
                data-gallery-image="true"
                target="_blank"
                rel="noreferrer"
              >
                <img src={image.listThumbnailUrl} alt="Gallery image" loading="lazy" />
              </a>
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="list-pagination" aria-label="Photo list pages">
              {page > 1 && <a href={listPageUrl(page - 1)} rel="prev">Previous</a>}
              <span aria-current="page">Page {page} of {totalPages}</span>
              {page < totalPages && <a href={listPageUrl(page + 1)} rel="next">Next</a>}
            </nav>
          )}
          <div className="list-year">
            <h3>2026</h3>
          </div>
        </div>
      </div>
    </main>
  );
}
