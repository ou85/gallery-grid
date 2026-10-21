const uploadPath = "/image/upload/";

function transformImage(url: string, transformation: string) {
  return url.replace(uploadPath, `${uploadPath}${transformation}/`);
}

export function galleryThumbnailUrl(url: string) {
  return transformImage(url, "c_scale,w_300/q_auto/f_auto");
}

export function listThumbnailUrl(url: string) {
  return transformImage(url, "c_fill,w_200,h_133/q_85/f_auto");
}

export function modalPreviewUrl(url: string) {
  return transformImage(url, "c_limit,w_1920,h_1200/q_auto/f_auto");
}
