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

const legacy: GalleryImage[] = legacyImages.map((originalUrl, index) => ({
  id: `legacy-${index}`,
  originalUrl,
  thumbnailUrl: galleryThumbnailUrl(originalUrl),
  listThumbnailUrl: listThumbnailUrl(originalUrl),
  createdAt: "",
  source: "legacy",
}));

export const getCloudinaryGalleryImages = unstable_cache(async (): Promise<GalleryImage[]> => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return [];

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  const { folder, lookup } = getCloudinaryFolder();
  const images: GalleryImage[] = [];
  let nextCursor: string | undefined;

  const addAssets = (assets: CloudinaryAsset[]) => {
    for (const asset of assets) {
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
  };

  const listByPrefix = async () => {
    nextCursor = undefined;
    do {
      const response: CloudinaryPage = await cloudinary.api.resources({
        resource_type: "image", type: "upload", prefix: `${folder}/`, max_results: 500, next_cursor: nextCursor,
      });
      addAssets(response.resources ?? []);
      nextCursor = response.next_cursor;
    } while (nextCursor);
  };

  if (lookup === "public-id-prefix") {
    try {
      await listByPrefix();
    } catch {
      return [];
    }
  } else try {
    do {
      const response: CloudinaryPage = await cloudinary.api.resources_by_asset_folder(folder, {
        resource_type: "image", type: "upload", max_results: 500, next_cursor: nextCursor,
      });
      addAssets(response.resources ?? []);
      nextCursor = response.next_cursor;
    } while (nextCursor);
  } catch {
    // Legacy fixed-folder accounts (including older Free plans) do not support
    // asset-folder listing. Their folder name is part of the public ID instead.
    console.warn("Asset-folder lookup failed; trying public-ID prefix.");
    try {
      await listByPrefix();
    } catch {
      console.error("Cloudinary gallery request failed; serving legacy images.");
      return [];
    }
  }

  return images
    .filter((image, index, all) => all.findIndex(({ id }) => id === image.id) === index)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}, ["cloudinary-gallery"], { revalidate: 300, tags: ["gallery-assets"] });

export function getLegacyImages() {
  return legacy;
}

export async function getGalleryCatalogue() {
  const cloudImages = await getCloudinaryGalleryImages();
  const images = [...legacy, ...cloudImages].filter(
    (image, index, all) => all.findIndex(({ originalUrl }) => originalUrl === image.originalUrl) === index
  );
  return { images, cloudCount: cloudImages.length };
}

export async function getGalleryImages() {
  return (await getGalleryCatalogue()).images;
}
