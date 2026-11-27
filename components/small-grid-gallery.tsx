"use client";

import { useEffect, useState } from "react";
import { ImageCrossfade } from "@/components/image-crossfade";

const gridSize = 12;
const imageCount = 50;
const imageUrl = (index: number) => `https://picsum.photos/300/200?random=${index}`;
const initialImages = Array.from({ length: gridSize }, (_, index) => index);

function shuffledIndexes() {
  const indexes = Array.from({ length: imageCount }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[randomIndex]] = [indexes[randomIndex], indexes[index]];
  }
  return indexes;
}

export function SmallGridGallery() {
  const [images, setImages] = useState(initialImages);

  useEffect(() => {
    let visible = initialImages;
    let deck = shuffledIndexes().filter((index) => !initialImages.includes(index));
    let lastUpdatedIndex = -1;
    const timer = window.setInterval(() => {
      const isAvailable = (image: number) => !visible.includes(image);
      let candidate = deck.findIndex(isAvailable);
      if (candidate === -1) {
        deck = shuffledIndexes();
        candidate = deck.findIndex(isAvailable);
      }
      if (candidate === -1) return;

      let index = Math.floor(Math.random() * visible.length);
      if (index === lastUpdatedIndex) index = (index + 1) % visible.length;
      lastUpdatedIndex = index;
      const [nextImage] = deck.splice(candidate, 1);
      visible = visible.map((image, slot) => slot === index ? nextImage : image);
      setImages(visible);
    }, 15_000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div id="photo-grid">
      {images.map((index, slot) => (
        <div className="cell" key={slot}>
          <ImageCrossfade
            className="image-crossfade"
            src={imageUrl(index)}
            href={imageUrl(index)}
            alt="Random image"
          />
        </div>
      ))}
    </div>
  );
}
