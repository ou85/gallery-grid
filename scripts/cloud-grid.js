const gridSize = 12;
const picBuffer = 30;
const indexBuffer = 3;
const refreshRate = 5 * 1000; 
const photoGrid = document.getElementById("photo-grid");
const cloudUrl = "https://res.cloudinary.com/dacsww4tg/image/upload/c_scale,w_300/q_auto:best";

// Fetches image paths from a JSON file
const fetchImagePaths = async () => {
    const response = await fetch('pictures/pictures.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// Creates a generator for unique random values from an array
const createUniqueRandomGenerator = (array, buffer) => {
    let lastUsed = [];
    return () => {
        let result;
        do {
            const randomIndex = Math.floor(Math.random() * array.length);
            result = array[randomIndex];
        } while (lastUsed.includes(result));
        lastUsed.push(result);
        if (lastUsed.length > buffer) {
            lastUsed.shift();
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
        image.src = '/pictures/2.jpg'; 
    };

    image.classList.add('fade-in');
    
    const cleanedImageUrl = imageUrl.replace("/c_scale,w_300/q_auto:best", "");
    image.src = imageUrl;
    link.href = cleanedImageUrl;
    link.appendChild(image);
    console.log('imageURL...' + imageUrl);
    console.log('cleanURL...' + cleanedImageUrl);
    return link;
}

// Creates a photo grid with a fade-in effect for each image
const createPhotoGrid = async () => {
    try {
        const paths = await fetchImagePaths();
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

            // Add a slight delay before re-adding the fade-in class to restart the animation
            setTimeout(() => {
                image.classList.add('fade-in');
            }, 10);
        }, refreshRate);

    } catch (error) {
        console.log('Fetch failed:', error);
        const errorMessageDiv = document.getElementById('error-message');
        errorMessageDiv.textContent = 'Oops! It is a ghost town here. Please try again later.';
    }
}

createPhotoGrid();