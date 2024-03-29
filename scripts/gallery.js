//
//
//     Note:  Images are named "X.jpg" where X is a number from 0 to 999,
//            and that they are all located in the "webgallery/Pictures" folder.
//
//
//
// ======  Setting constants ========
//
const amountOfPictures = 300; //________________________Amount of pictures in folder "Pictures"
const refresh = 30; //__________________________________Page Refresh rate in seconds
const baseUrl = 'pictures'; //__________________________Base URL
//
//
// ======  Set up photo grid ========
//
let imageIndexes = Array.from({length: amountOfPictures}, (_, i) => i + 1);

const shuffle = array => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

shuffle(imageIndexes);

const getNextImageIndex = () => {
  if (imageIndexes.length === 0) {
    // If the array is empty, create and shuffle a new array
    imageIndexes = Array.from({length: amountOfPictures}, (_, i) => i + 1);
    shuffle(imageIndexes);
  }
  return imageIndexes.pop();
}

const photoGrid = document.getElementById("photo-grid");

const refreshRate = refresh*1000; 

console.log("Images in rotation: " + amountOfPictures);

const getRandomIntExcept = (min, max, except) => {
  let result;
  do {
    result = Math.floor(Math.random() * (max - min + 1)) + min;
  } while (result === except);
  return result;
}

let lastUpdatedIndex = null;

const changeRandomImage = () => {
  const cells = photoGrid.querySelectorAll(".cell");
  const randomIndex = getRandomIntExcept(0, cells.length - 1, lastUpdatedIndex);
  lastUpdatedIndex = randomIndex;
  const cell = cells[randomIndex];
  const image = cell.querySelector("img");
  const randomImageIndex = getNextImageIndex();
  const imageUrl = `${baseUrl}/${randomImageIndex}.jpg`;

  image.classList.remove('fade-in');
  
  image.onload = () => {
    image.classList.add('fade-in');
  };

  image.setAttribute("src", imageUrl);
}

setInterval(changeRandomImage, refreshRate);

const createImageLink = index => {
  const link = document.createElement("a");
  const image = document.createElement("img");
  const imageUrl = `${baseUrl}/${index}.jpg`;
  image.src = imageUrl;
  link.href = imageUrl;
  link.appendChild(image);
  return link;
}

for (let i = 1; i < 10; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  const imageLink = createImageLink(getNextImageIndex());
  cell.appendChild(imageLink);
  photoGrid.appendChild(cell);
}

