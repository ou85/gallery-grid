const preload = 15;
const gridSize = 12;
const picBuffer = 30;
const indexBuffer = 3;
const refreshRate = 60 * 1000; 
const preloadThreshold = preload - 5;
const photoGrid = document.getElementById("photo-grid");
// const cloudUrl = "https://res.cloudinary.com/dacsww4tg/image/upload/c_scale,w_300/q_auto:best";
// const cloudUrl = "https://res.cloudinary.com/dacsww4tg/image/upload/c_scale,w_300/q_95";
const cloudUrl = "https://res.cloudinary.com/dacsww4tg/image/upload/c_scale,w_300";

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
        image.src = '/pictures/2.jpg'; 
    };

    image.classList.add('fade-in');

    const cleanedImageUrl = imageUrl.replace("/c_scale,w_300/q_auto:best", "");
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
            console.log(`Image src: ${image.src.replace("/c_scale,w_300/q_auto:best", "")}`);

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

//-------------------------------NEW-------------------------------------------------------------
// This function preloads an image by creating a new Image object and setting its src
// function preloadImage(url) {
//     const img = new Image();
//     img.src = url;
// }

// // // This function preloads a subset of images in an array
// function preloadImages(urls, start, count) {
//     urls.slice(start, start + count).forEach(preloadImage);
// }

// // Creates a photo grid with a fade-in effect for each image
// const createPhotoGrid = async () => {
//     try {
//         const paths = await fetchImagePaths();
//         const imageUrls = paths.map(path => path.trim() !== "" ? `${cloudUrl}${path}` : "/pictures/1.jpg");

//         // Preload the first `preload` images
//         preloadImages(imageUrls, 0, preload);

//         let preloadedUrls = imageUrls.slice(0, preload);
//         let preloadIndex = preload;

//         const displayedUrls = new Set();
      
//         const getRandomUrl = () => {
//             if (preloadedUrls.length <= preloadThreshold) {
//                 // Preload more images when the number of preloaded images reaches the threshold
//                 preloadImages(imageUrls, preloadIndex, preload);
//                 preloadedUrls = preloadedUrls.concat(imageUrls.slice(preloadIndex, preloadIndex + preload));
//                 preloadIndex += preload;
//             }

//             // Get a random preloaded image that is not currently displayed and remove it from the array
//             let randomIndex;
//             let url;
//             do {
//                 randomIndex = Math.floor(Math.random() * preloadedUrls.length);
//                 url = preloadedUrls[randomIndex];
//             } while (displayedUrls.has(url));

//             preloadedUrls.splice(randomIndex, 1);
//             displayedUrls.add(url);

//             // If there are too many displayed URLs, remove some
//             if (displayedUrls.size > gridSize) {
//                 displayedUrls.delete([...displayedUrls][0]);
//             }

//             return url;
//         };

//         const getRandomIndex = createUniqueRandomGenerator([...Array(gridSize).keys()], indexBuffer);

//         for (let i = 1; i <= gridSize; i++) {
//             const cell = document.createElement("div");
//             cell.className = "cell";
//             const imageLink = createImageLink(getRandomUrl());
//             cell.appendChild(imageLink);
//             photoGrid.appendChild(cell);
//         }

//         setInterval(() => {
//             const cells = photoGrid.querySelectorAll(".cell");
//             const cell = cells[getRandomIndex()];
//             const image = cell.querySelector("img");

//             displayedUrls.delete(image.src);
//             image.classList.remove('fade-in');
//             image.src = getRandomUrl();

//             // Add a slight delay before re-adding the fade-in class to restart the animation
//             setTimeout(() => {
//                 image.classList.add('fade-in');
//             }, 10);
//         }, refreshRate);

//     } catch (error) {
//         console.log('Fetch failed:', error);
//         const errorMessageDiv = document.getElementById('error-message');
//         errorMessageDiv.textContent = 'Oops! It is a ghost town here. Please try again later.';
//     }
// }
//-------------------------------NEW ENDS------------------------------------------------------------
createPhotoGrid();
