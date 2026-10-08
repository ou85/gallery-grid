import type { GalleryImage } from "@/lib/gallery-assets";

const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
};

export class ImageDeck {
  private remaining: GalleryImage[] = [];

  constructor(private readonly images: GalleryImage[]) {}

  next(excluded: string[] = []) {
    if (!this.remaining.length) this.remaining = shuffle(this.images);
    const excludedIds = new Set(excluded);
    let index = this.remaining.length - 1;
    while (index >= 0 && excludedIds.has(this.remaining[index].id)) index -= 1;
    return this.remaining.splice(index >= 0 ? index : this.remaining.length - 1, 1)[0];
  }
}
