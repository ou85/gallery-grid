const photoGrid = document.getElementById("photo-grid");

const createImageLink = (imageUrl) => {
  const link = document.createElement("a");
  const image = document.createElement("img");

  image.onerror = () => {
    console.log("Image not found, using default image");
    image.src = "../pictures/2.jpg";
  };

  image.classList.add("fade-in");
  image.src = imageUrl;
  link.href = imageUrl;
  link.appendChild(image);

  return link;
};

const createPhotoGrid = () => {
  const imageUrls = window.GALLERY_IMAGES;
  console.log(`Number of links: ${imageUrls.length}`);

  imageUrls.forEach((url) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.appendChild(createImageLink(url));
    photoGrid.appendChild(cell);
  });

  document.getElementById("info").textContent = `Total number of pictures: ${imageUrls.length}`;
};

createPhotoGrid();
