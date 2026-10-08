import { getCloudinaryGalleryImages, getGalleryImages } from "@/lib/gallery-assets";

export const dynamic = "force-dynamic";

export default async function ListPage() {
  const [images, cloudImages] = await Promise.all([getGalleryImages(), getCloudinaryGalleryImages()]);
  return <main className="container" data-layout="list"><div className="list-content"><div className="clockpage list-header"><a className="home-link" href="/">Home</a><p>Total number of pictures: {images.length} · <a href="/gallery">Gallery: {cloudImages.length}</a></p></div><div id="photo-grid">{images.map((image) => <a key={image.id} href={image.originalUrl} target="_blank" rel="noreferrer"><img src={image.originalUrl} alt="Gallery image" /></a>)}</div><div className="list-year"><h3>2026</h3></div></div></main>;
}
