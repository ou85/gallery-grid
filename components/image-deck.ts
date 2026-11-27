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

  next(excluded: Iterable<string> = []): GalleryImage | undefined {
    const excludedIds = new Set(excluded);
    const eligible = (image: GalleryImage) => !excludedIds.has(image.id);
    const findEligible = () => {
      let index = this.remaining.length - 1;
      while (index >= 0 && !eligible(this.remaining[index])) index -= 1;
      return index;
    };
    let index = findEligible();
    // A blocked tail must not force a duplicate or stop the rotation indefinitely.
    if (index < 0 && this.images.some(eligible)) {
      this.remaining = shuffle(this.images);
      index = findEligible();
    }
    if (index < 0) return undefined;
    return this.remaining.splice(index, 1)[0];
  }
}

export const repeatDelayMs = 60 * 60 * 1_000;

export type GalleryTransition = { index: number; image: GalleryImage };

export class GalleryRotation {
  private readonly deck: ImageDeck;
  private readonly slots: GalleryImage[] = [];
  private readonly eligibleAfter = new Map<string, number>();
  private pending: GalleryTransition | undefined;
  private size = 0;
  private lastIndex = -1;

  constructor(images: GalleryImage[]) {
    this.deck = new ImageDeck(images);
  }

  snapshot() {
    const pending = this.pending;
    const frames = this.slots.map((image, index) => index === pending?.index ? pending.image : image);
    return { frames, pending };
  }

  resize(size: number, now: number) {
    this.size = size;
    for (const image of this.slots.splice(size)) this.retire(image, now);
    if (this.pending && this.pending.index >= size) {
      this.retire(this.pending.image, now);
      this.pending = undefined;
    }
    this.fillSlots(now);
  }

  advance(now: number) {
    if (this.pending) return false;
    if (this.fillSlots(now)) return true;
    if (this.slots.length < 2) return false;

    const image = this.deck.next(this.exclusions(now));
    if (!image) return false;
    let index = Math.floor(Math.random() * this.slots.length);
    if (index === this.lastIndex) index = (index + 1) % this.slots.length;
    this.pending = { index, image };
    return true;
  }

  settle(transition: GalleryTransition, displayed: boolean, now: number) {
    if (transition !== this.pending) return false;

    if (displayed) {
      this.retire(this.slots[transition.index], now);
      this.slots[transition.index] = transition.image;
      this.lastIndex = transition.index;
    } else {
      this.retire(transition.image, now);
    }
    this.pending = undefined;
    return true;
  }

  private retire(image: GalleryImage, now: number) {
    this.eligibleAfter.set(image.id, now + repeatDelayMs);
  }

  private exclusions(now: number) {
    const excluded = new Set(this.slots.map(({ id }) => id));
    if (this.pending) excluded.add(this.pending.image.id);
    for (const [id, until] of this.eligibleAfter) {
      if (now < until) excluded.add(id);
      else this.eligibleAfter.delete(id);
    }
    return excluded;
  }

  private fillSlots(now: number) {
    let changed = false;
    const excluded = this.exclusions(now);
    while (this.slots.length < this.size) {
      const image = this.deck.next(excluded);
      if (!image) break;
      this.slots.push(image);
      excluded.add(image.id);
      changed = true;
    }
    return changed;
  }
}
