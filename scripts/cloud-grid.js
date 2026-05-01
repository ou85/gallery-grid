const preload = 15;              // Number of images to preload
const gridSize = 12;             // Number of images in the grid
const picBuffer = 50;            // Buffer for random image generator
const indexBuffer = 4;           // Buffer for random index generator
const refreshRate = 30 * 1000;   // Refresh rate in milliseconds
const photoGrid = document.getElementById("photo-grid");
const cloudUrl = "https://res.cloudinary.com/dacsww4tg/image/upload/c_scale,w_300";

// Offline fallback images (local fallbacks)

// const fallbackImages = [
//     '../pictures/1.jpg',
//     '../pictures/2.jpg',
//     '../pictures/3.jpg',
//     '../pictures/4.jpg',
//     '../pictures/5.jpg'
// ];

const fallbackImages = Array.from({length: 300}, (_, i) => `../pictures/${i + 1}.jpg`);

// Fetches image paths from a JSON file with offline fallback
const fetchImagePaths = async () => {
    try {
        // Try to fetch from network first
        const response = await fetch('../pictures.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const paths = await response.json();
        
        // Cache the paths for offline use
        localStorage.setItem('cachedImagePaths', JSON.stringify(paths));
        localStorage.setItem('lastCacheTime', Date.now().toString());
        
        return paths;
    } catch (error) {
        console.log('Network fetch failed, trying cache:', error);
        
        // Try to use cached data
        const cachedPaths = localStorage.getItem('cachedImagePaths');
        if (cachedPaths) {
            console.log('Using cached image paths');
            return JSON.parse(cachedPaths);
        }
        
        // If no cache, return fallback image paths
        console.log('No cache available, using fallback images');
        return fallbackImages.map(() => ''); // Empty paths will trigger fallback
    }
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
const createImageLink = (imageUrl, isOffline = false) => {
    const link = document.createElement("a");
    const image = document.createElement("img");
    
    image.onerror = () => {
        console.log("Image not found, using fallback image");
        // Use a random fallback image
        const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
        image.src = randomFallback;
        link.href = randomFallback;
    };

    image.classList.add('fade-in');

    if (isOffline || imageUrl === '') {
        // Use fallback image for offline mode or empty paths
        const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
        image.src = randomFallback;
        link.href = randomFallback;
    } else {
        const cleanedImageUrl = imageUrl.replace("/c_scale,w_300", "");
        image.src = imageUrl;
        link.href = cleanedImageUrl;
    }
    
    link.appendChild(image);

    return link;
}

// Creates a photo grid with a fade-in effect for each image
const createPhotoGrid = async () => {
    try {
        const paths = await fetchImagePaths();
        console.log(`Number of links: ${paths.length}`);
        console.log(`Check them all at https://gallery-grid-theta.vercel.app/pages/list.html`);
        
        // Check if we're in offline mode (using cached data or fallbacks)
        const isOffline = navigator.onLine === false || 
                          (paths.length > 0 && paths[0] === '') ||
                          localStorage.getItem('cachedImagePaths') !== null && navigator.onLine === false;
        
        if (isOffline) {
            console.log('Running in offline mode');
        }
        
        const imageUrls = paths.map(path => {
            if (path.trim() === "") {
                return ""; // Will trigger fallback
            }
            return `${cloudUrl}${path}`;
        });
        
        const getRandomUrl = createUniqueRandomGenerator(imageUrls, picBuffer);
        const getRandomIndex = createUniqueRandomGenerator([...Array(gridSize).keys()], indexBuffer);

        for (let i = 1; i <= gridSize; i++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            const imageLink = createImageLink(getRandomUrl(), isOffline);
            cell.appendChild(imageLink);
            photoGrid.appendChild(cell);
        }

        // Set up refresh interval with offline awareness
        setInterval(() => {
            const cells = photoGrid.querySelectorAll(".cell");
            const cell = cells[getRandomIndex()];
            const image = cell.querySelector("img");

            image.classList.remove('fade-in');
            
            // Check connectivity before trying to load new images
            if (navigator.onLine && !isOffline) {
                image.src = getRandomUrl();
                console.log(`Image src: ${image.src.replace("/c_scale,w_300", "")}`);
            } else {
                // Use fallback images when offline
                const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
                image.src = randomFallback;
                console.log(`Offline mode - Using fallback: ${randomFallback}`);
            }

            // Add a slight delay before re-adding the fade-in class to restart the animation
            setTimeout(() => {
                image.classList.add('fade-in');
            }, 20);
        }, refreshRate);

        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('Connection restored - will try to fetch fresh images on next refresh');
        });
        
        window.addEventListener('offline', () => {
            console.log('Connection lost - switching to offline mode');
        });

    } catch (error) {
        console.log('Fetch failed:', error);
        const errorMessageDiv = document.getElementById('error-message');
        if (errorMessageDiv) {
            errorMessageDiv.textContent = 'Running in offline mode with cached images.';
        }
        
        // Still try to create grid with fallback images
        const fallbackGrid = () => {
            for (let i = 1; i <= gridSize; i++) {
                const cell = document.createElement("div");
                cell.className = "cell";
                const imageLink = createImageLink('', true);
                cell.appendChild(imageLink);
                photoGrid.appendChild(cell);
            }
        };
        
        fallbackGrid();
    }
}

createPhotoGrid();
