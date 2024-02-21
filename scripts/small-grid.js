//
// ======  Setting constants ========
//
const refreshRate = 15000; // 15 seconds
const baseUrl = "https://picsum.photos/300/200";
const arrayLength = 50; // Number of images to cycle through
const gridLength = 12; // Number of images to show in grid
//
//
// ======  Set up photo grid ========
//
const shuffleArray = array => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const getRandomInt = (min, max, except) => {
  let result;
  do {
    result = Math.floor(Math.random() * (max - min + 1)) + min;
  } while (result === except);
  return result;
}
// Array of `arrayLength` indexes, shuffled
let imageIndexes = shuffleArray([...Array(arrayLength).keys()]); 
let currentImageIndex = 0;

console.log("Images in array: " + imageIndexes.length);
console.log("Array: " + imageIndexes);

const photoGrid = document.getElementById("photo-grid");

let lastUpdatedIndex = null;
const changeRandomImage = () => {
  const cells = photoGrid.querySelectorAll(".cell");
  const randomIndex = getRandomInt(0, cells.length - 1, lastUpdatedIndex);
  lastUpdatedIndex = randomIndex;
  const cell = cells[randomIndex];
  const image = cell.querySelector("img");
  const randomImageIndex = getNextImageIndex();
  const imageUrl = `${baseUrl}?random=${randomImageIndex}`;

  image.classList.remove('fade-in');

  image.onload = () => {
    image.classList.add('fade-in');
  };

  image.setAttribute("src", imageUrl);
}

const createImageLink = index => {
  const link = document.createElement("a");
  const image = document.createElement("img");
  const imageUrl = `${baseUrl}?random=${index}`;
  link.href = imageUrl;
  link.appendChild(image);

  image.onload = () => {
    image.classList.add('fade-in');
  };

  image.src = imageUrl;

  return link;
}

const createCell = index => {
  const cell = document.createElement("div");
  cell.className = "cell";
  const imageLink = createImageLink(index);
  cell.appendChild(imageLink);
  return cell;
}

const createGrid = () => {
  for (let i = 0; i < gridLength; i++) {
    const cell = createCell(getNextImageIndex());
    photoGrid.appendChild(cell);
  }
}

const getNextImageIndex = () => {
  if (currentImageIndex >= imageIndexes.length) {
    imageIndexes = shuffleArray(imageIndexes); // Reshuffle the array when all images have been shown
    currentImageIndex = 0;
  }
  return imageIndexes[currentImageIndex++];
}

createGrid();
setInterval(changeRandomImage, refreshRate);
