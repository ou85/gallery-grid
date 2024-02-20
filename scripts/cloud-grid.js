//
//
//     Note:  Images links are in json file "pictures.json" 
//            located in the "pictures" folder.,
//            
//
//
//
// ======  Setting constants ========
//
const refresh = 30; //__________________________________Page Refresh rate in seconds
const cloudUrl = "https://res.cloudinary.com/dacsww4tg/image/upload";
//
//
// ======  Set up photo grid ========
//
fetch('pictures/pictures.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(paths => {
    // let imageUrls = paths.map(path => `${cloudUrl}${path}`);

    let imageUrls = paths.map(path => {
      if (path.trim() !== "") {
        return `${cloudUrl}${path}`;
      } else {
        return "/v1683698616/wallpapers/1214775_z3msnp.jpg";
      }
    });
    
    console.log(`There are ${imageUrls.length} images in the JSON file.`)
    console.log(`There Array: ${imageUrls}`)

    let lastUsedUrls = [];

    const getRandomURL = () => {
      let randomUrl;
      do {
        const randomIndex = Math.floor(Math.random() * imageUrls.length);
        randomUrl = imageUrls[randomIndex];
      } while (lastUsedUrls.includes(randomUrl));

      lastUsedUrls.push(randomUrl);

      // If the list of last used URLs is longer than picBuffer, remove the oldest URL
      let picBuffer = 30;
      if (lastUsedUrls.length > picBuffer) {
        lastUsedUrls.shift();
      }

      return randomUrl;
    }

    console.log("Random Image URL:" + getRandomURL());

    const photoGrid = document.getElementById("photo-grid");

    const refreshRate = refresh*1000; 
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
      const cell = cells[randomIndex];
      const image = cell.querySelector("img");
      const imageUrl = getRandomURL();
    
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
      const imageUrl = getRandomURL();
      image.src = imageUrl;
      link.href = imageUrl;
      link.appendChild(image);
      return link;
    }
   
    let gridSize = 10;
    for (let i = 1; i < gridSize; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const imageLink = createImageLink(getRandomURL());
      cell.appendChild(imageLink);
      photoGrid.appendChild(cell);
    }

  })
  .catch(error => {
    console.log('Fetch failed:', error);
    const errorMessageDiv = document.getElementById('error-message');
    errorMessageDiv.textContent = 'Oops! It is a ghost town here. Please try again later.';
  });

//
// ======  Set up clock ========
//
const updateClock = () => {
  const clockElement = document.getElementById("clock");
  const day = document.getElementById("dayOfWeek");
  const dayOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const days = now.getDay();
  clockElement.innerText = timeString;
  day.innerHTML = dayOfWeek[days];
}
setInterval(updateClock, 1000);
