const gridSize = 12;
const refreshRate = 15 * 1000;
const photoGrid = document.getElementById("photo-grid");
const imageDeck = window.createImageDeck(window.GALLERY_IMAGES);
const fallbackImages = Array.from({ length: 300 }, (_, i) => `../pictures/${i + 1}.jpg`);

const thumbnailUrl = (imageUrl) => imageUrl.replace(
  "/image/upload/",
  "/image/upload/c_scale,w_300/"
);

const getRandomIntExcept = (min, max, except) => {
  let result;
  do {
    result = Math.floor(Math.random() * (max - min + 1)) + min;
  } while (result === except);
  return result;
};

const getVisibleUrls = (exceptCell) => [...photoGrid.querySelectorAll(".cell")]
  .filter((cell) => cell !== exceptCell)
  .map((cell) => cell.querySelector("img").dataset.originalUrl);

const useFallback = (image, link) => {
  const fallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
  image.onerror = null;
  image.dataset.originalUrl = fallback;
  image.src = fallback;
  link.href = fallback;
};

const createImageLink = (imageUrl) => {
  const link = document.createElement("a");
  const image = document.createElement("img");

  image.classList.add("fade-in");
  image.dataset.originalUrl = imageUrl;
  image.onerror = () => useFallback(image, link);
  image.src = thumbnailUrl(imageUrl);
  link.href = imageUrl;
  link.appendChild(image);

  return link;
};

for (let i = 0; i < gridSize; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.appendChild(createImageLink(imageDeck.next()));
  photoGrid.appendChild(cell);
}

let lastUpdatedIndex = null;

setInterval(() => {
  const cells = photoGrid.querySelectorAll(".cell");
  const randomIndex = getRandomIntExcept(0, cells.length - 1, lastUpdatedIndex);
  const cell = cells[randomIndex];
  const image = cell.querySelector("img");
  const link = image.closest("a");
  const imageUrl = imageDeck.next(getVisibleUrls(cell));

  lastUpdatedIndex = randomIndex;
  image.classList.remove("fade-in");
  image.dataset.originalUrl = imageUrl;
  image.onerror = () => useFallback(image, link);
  image.src = thumbnailUrl(imageUrl);
  link.href = imageUrl;

  setTimeout(() => image.classList.add("fade-in"), 20);
}, refreshRate);
