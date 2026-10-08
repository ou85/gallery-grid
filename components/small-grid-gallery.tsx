"use client";

import { useEffect, useState } from "react";

const gridSize = 12;
const imageCount = 50;
const imageUrl = (index: number) => `https://picsum.photos/300/200?random=${index}`;

function shuffledIndexes() {
  const indexes = Array.from({ length: imageCount }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[randomIndex]] = [indexes[randomIndex], indexes[index]];
  }
  return indexes;
}

export function SmallGridGallery() {
  const [images, setImages] = useState(() => Array.from({ length: gridSize }, (_, index) => index));

  useEffect(() => {
    let deck = shuffledIndexes();
    let deckIndex = 0;
    const nextImage = () => {
      if (deckIndex >= deck.length) {
        deck = shuffledIndexes();
        deckIndex = 0;
      }
      return deck[deckIndex++];
    };

    setImages(Array.from({ length: gridSize }, nextImage));

    let lastUpdatedIndex = -1;
    const timer = window.setInterval(() => {
      setImages((current) => {
        let index = Math.floor(Math.random() * current.length);
        if (index === lastUpdatedIndex) index = (index + 1) % current.length;
        lastUpdatedIndex = index;
        return current.map((image, currentIndex) => currentIndex === index ? nextImage() : image);
      });
    }, 15_000);

    return () => window.clearInterval(timer);
  }, []);

  return <div id="photo-grid">
    {images.map((index) => <div className="cell" key={index}>
      <a href={imageUrl(index)} target="_blank" rel="noreferrer">
        <img src={imageUrl(index)} alt="Random image" />
      </a>
    </div>)}
  </div>;
}
