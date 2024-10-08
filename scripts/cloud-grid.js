const preload = 15;              // Number of images to preload
const gridSize = 12;             // Number of images in the grid
const picBuffer = 50;            // Buffer for random image generator
const indexBuffer = 4;           // Buffer for random index generator
const refreshRate = 30 * 1000;   // Refresh rate in milliseconds
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

// Creates a generator for unique random values from an array
const createUniqueRandomGenerator = (array, buffer) => {
    let lastUsedValues = []; 
    let lastUsedSet = new Set(); 

    return () => {
        let result;
        do {
            const randomIndex = Math.floor(Math.random() * array.length);
            result = array[randomIndex];
        } while (lastUsedSet.has(result)); 

        lastUsedValues.push(result);
        lastUsedSet.add(result); 

        if (lastUsedValues.length > buffer) { 
            const firstItem = lastUsedValues.shift(); 
            lastUsedSet.delete(firstItem); 
        }

        return result;
    }
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
        const getRandomUrl = createUniqueRandomGenerator(imageUrls, picBuffer);
        const getRandomIndex = createUniqueRandomGenerator([...Array(gridSize).keys()], indexBuffer);

        for (let i = 1; i <= gridSize; i++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            const imageLink = createImageLink(getRandomUrl());
            cell.appendChild(imageLink);
            photoGrid.appendChild(cell);
        }

        setInterval(() => {
            const cells = photoGrid.querySelectorAll(".cell");
            const cell = cells[getRandomIndex()];
            const image = cell.querySelector("img");

            image.classList.remove('fade-in');
            image.src = getRandomUrl();
            console.log(`Image src: ${image.src.replace("/c_scale,w_300", "")}`);

            // Add a slight delay before re-adding the fade-in class to restart the animation
            setTimeout(() => {
                image.classList.add('fade-in');
            }, 20);
        }, refreshRate);

    } catch (error) {
        console.log('Fetch failed:', error);
        const errorMessageDiv = document.getElementById('error-message');
        errorMessageDiv.textContent = 'Oops! It is a ghost town here. Please try again later.';
    }
}

createPhotoGrid();
