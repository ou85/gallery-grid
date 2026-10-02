const refresh = 30;
const photoGrid = document.getElementById("photo-grid");
const imageDeck = window.createImageDeck(window.GALLERY_IMAGES);
const refreshRate = refresh * 1000;

console.log(`Images in rotation: ${imageDeck.size}`);

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

const createImageLink = (imageUrl) => {
  const link = document.createElement("a");
  const image = document.createElement("img");

  image.src = imageUrl;
  image.dataset.originalUrl = imageUrl;
  link.href = imageUrl;
  link.appendChild(image);

  return link;
};

for (let i = 0; i < 9; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.appendChild(createImageLink(imageDeck.next()));
  photoGrid.appendChild(cell);
}

let lastUpdatedIndex = null;

const changeRandomImage = () => {
  const cells = photoGrid.querySelectorAll(".cell");
  const randomIndex = getRandomIntExcept(0, cells.length - 1, lastUpdatedIndex);
  const cell = cells[randomIndex];
  const image = cell.querySelector("img");
  const imageUrl = imageDeck.next(getVisibleUrls(cell));

  lastUpdatedIndex = randomIndex;
  image.classList.remove("fade-in");
  image.onload = () => image.classList.add("fade-in");
  image.dataset.originalUrl = imageUrl;
  image.src = imageUrl;
  image.closest("a").href = imageUrl;
};

setInterval(changeRandomImage, refreshRate);
