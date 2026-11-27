const pageSize = 60;

export function paginateGallery<T>(items: T[], requestedPage: string | string[] | undefined) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const requested = typeof requestedPage === "string" && /^\d+$/.test(requestedPage)
    ? Number(requestedPage)
    : 1;
  const page = Math.max(1, Math.min(totalPages, requested));
  const start = (page - 1) * pageSize;
  return { page, totalPages, items: items.slice(start, start + pageSize) };
}
