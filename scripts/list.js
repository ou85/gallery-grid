const photoGrid = document.getElementById("photo-grid");
const cloudUrl = "https://res.cloudinary.com/dacsww4tg/image/upload/c_scale,w_300";

// Fetches image paths from a JSON file
const fetchImagePaths = async () => {
    const response = await fetch('../pictures.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// Creates a new link element with an image child element
const createImageLink = imageUrl => {
    const link = document.createElement("a");
    const image = document.createElement("img");
    image.onerror = () => {
        console.log("Image not found, using default image");
        image.src = '../pictures/2.jpg'; 
    };

    image.classList.add('fade-in');
    const cleanedImageUrl = imageUrl.replace("/c_scale,w_300", "");
    image.src = imageUrl;
    link.href = cleanedImageUrl;
    link.appendChild(image);

    return link;
}

// Creates a photo grid with a fade-in effect for each image
const createPhotoGrid = async () => {
    try {
        const paths = await fetchImagePaths();
        console.log(`Number of links: ${paths.length}`);
        console.log(`Check them all at https://gallery-grid-theta.vercel.app/pages/list.html`);
        const imageUrls = paths.map(path => path.trim() !== "" ? `${cloudUrl}${path}` : "/pictures/1.jpg");

        imageUrls.forEach(url => {
            const cell = document.createElement("div");
            cell.className = "cell";
            const imageLink = createImageLink(url);
            cell.appendChild(imageLink);
            photoGrid.appendChild(cell);
        });

        document.getElementById("info").innerHTML = `Total number of pictures: ${paths.length}`;

    } catch (error) {
        console.log('Fetch failed:', error);
        const errorMessageDiv = document.getElementById('error-message');
        errorMessageDiv.textContent = 'Oops! It is a ghost town here. Please try again later.';
    }
}

createPhotoGrid();
