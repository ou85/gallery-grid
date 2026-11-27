type CloudinaryFolder = {
  folder: string;
  lookup: "asset-folder" | "public-id-prefix";
};

export function getCloudinaryFolder(): CloudinaryFolder {
  const assetFolder = process.env.CLOUDINARY_GALLERY_FOLDER;
  if (assetFolder) return { folder: assetFolder, lookup: "asset-folder" };

  // CLOUDINARY_FOLDER is the fixed-folder setting used by this project.
  const fixedFolder = process.env.CLOUDINARY_FOLDER;
  if (fixedFolder) return { folder: fixedFolder, lookup: "public-id-prefix" };

  return { folder: "gallery", lookup: "asset-folder" };
}
