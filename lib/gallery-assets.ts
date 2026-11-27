import { v2 as cloudinary } from "cloudinary";
import { unstable_cache } from "next/cache";
import legacyImages from "@/images";
import { getCloudinaryFolder } from "@/lib/cloudinary-folder";
import { galleryThumbnailUrl, listThumbnailUrl } from "@/lib/cloudinary-image-url";

export type GalleryImage = {
  id: string;
  originalUrl: string;
  thumbnailUrl: string;
  listThumbnailUrl: string;
  createdAt: string;
  source: "legacy" | "gallery";
};

type CloudinaryAsset = {
  asset_id?: string;
  secure_url?: string;
  created_at?: string;
};

type CloudinaryPage = {
  resources?: CloudinaryAsset[];
  next_cursor?: string;
};

type CloudinaryCatalogue = {
  images: GalleryImage[];
  status: "available" | "unconfigured" | "unavailable";
};

const legacy: GalleryImage[] = legacyImages.map((originalUrl, index) => ({
  id: `legacy-${index}`,
  originalUrl,
  thumbnailUrl: galleryThumbnailUrl(originalUrl),
  listThumbnailUrl: listThumbnailUrl(originalUrl),
  createdAt: "",
  source: "legacy",
}));

async function listImages(getPage: (cursor?: string) => Promise<CloudinaryPage>): Promise<GalleryImage[]> {
  const images: GalleryImage[] = [];
  let nextCursor: string | undefined;

  do {
    const response = await getPage(nextCursor);
    if (!Array.isArray(response.resources)) throw new Error("Cloudinary returned an invalid resource list.");
    for (const asset of response.resources) {
      if (!asset.secure_url || !asset.asset_id) continue;
      images.push({
        id: asset.asset_id,
        originalUrl: asset.secure_url,
        thumbnailUrl: galleryThumbnailUrl(asset.secure_url),
        listThumbnailUrl: listThumbnailUrl(asset.secure_url),
        createdAt: asset.created_at ?? "",
        source: "gallery",
      });
    }
    nextCursor = response.next_cursor;
  } while (nextCursor);

  return images
    .filter((image, index, all) => all.findIndex(({ id }) => id === image.id) === index)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function loadImages({ folder, lookup }: ReturnType<typeof getCloudinaryFolder>) {
  if (lookup === "asset-folder") {
    try {
      return await listImages((next_cursor) => cloudinary.api.resources_by_asset_folder(folder, {
        resource_type: "image", type: "upload", max_results: 500, next_cursor,
      }));
    } catch (error) {
      // Cloudinary returns 404 for this endpoint in fixed folder mode. Check the
      // account mode before trying a different lookup for an ambiguous 404.
      const details = error && typeof error === "object" && "error" in error ? error.error : undefined;
      if (!details || typeof details !== "object" || !("http_code" in details) || details.http_code !== 404) {
        throw error;
      }
      const { settings } = await cloudinary.api.config({ settings: true });
      if (settings?.folder_mode !== "fixed") throw error;
    }
  }

  return listImages((next_cursor) => cloudinary.api.resources({
    resource_type: "image", type: "upload", prefix: `${folder}/`, max_results: 500, next_cursor,
  }));
}

const getCachedCloudinaryImages = unstable_cache(
  async (cloudName: string, folder: ReturnType<typeof getCloudinaryFolder>) => {
    try {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      return await loadImages(folder);
    } catch {
      // Next logs background refresh failures. Keep upstream details out of that log.
      throw new Error("Cloudinary gallery request failed.");
    }
  },
  ["cloudinary-gallery"],
  { revalidate: 300, tags: ["gallery-assets"] },
);

export async function getCloudinaryCatalogue(): Promise<CloudinaryCatalogue> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return { images: [], status: "unconfigured" };
  }

  try {
    const images = await getCachedCloudinaryImages(cloudName, getCloudinaryFolder());
    return { images, status: "available" };
  } catch {
    console.error("Cloudinary catalogue unavailable.");
    return { images: [], status: "unavailable" };
  }
}

export function getLegacyImages() {
  return legacy;
}

export async function getGalleryCatalogue() {
  const { images: cloudImages } = await getCloudinaryCatalogue();
  const images = [...legacy, ...cloudImages].filter(
    (image, index, all) => all.findIndex(({ originalUrl }) => originalUrl === image.originalUrl) === index
  );
  return { images, cloudCount: cloudImages.length };
}

export async function getGalleryImages() {
  return (await getGalleryCatalogue()).images;
}
