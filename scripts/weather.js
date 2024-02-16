//
// TODO: 
//      - Hide / Show weather widget.
//
// ======  Setting constants ========
//
let defaultCity = 'Stockholm'; //_________________________________________ Default city
let refreshWeather = 15; //_______________________________________________ Page Refresh rate in minutes
//
//
// ======  Fetching weather data ========
const form = document.querySelector(".bottom-banner form");
const input = document.querySelector(".bottom-banner input");
const msg = document.querySelector(".bottom-banner .msg");
const list = document.querySelector(".ajax-section .cities");
const apiKey =  "935dab6fc9876743c9ec8fba2e687c63";

// Create a single list item for the city
const li = document.createElement("li");
li.classList.add("city");
list.appendChild(li);

// Function to fetch weather data
function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const { main, name, sys, weather } = data;
      const icon = `https://openweathermap.org/img/wn/${
        weather[0]["icon"]
      }@2x.png`;

      const markup = `
        <div class="city-info">
          <h2 class="city-name" data-name="${name},${sys.country}">
            <span>${name}</span>
            <sup>${sys.country}</sup>
          </h2>
          <div class="city-temp">${Math.round(main.temp)}<sup>°C</sup></div>
          <figcaption>${weather[0]["description"]}</figcaption>
          <figure>
            <img class="city-icon" src="${icon}" alt="${weather[0]["description"]}">
          </figure>
        </div>
      `;
      li.innerHTML = markup;
    })
    .catch(() => {
      msg.textContent = "Please enter a city name";
    });
}

// Function to set a cookie
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; SameSite=Lax; path=/";
}

// Function to get a cookie
function getCookie(name) {
  let nameEQ = name + "=";
  let ca = document.cookie.split(';');
  for(let i=0;i < ca.length;i++) {
    let c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

// Fetch weather data for default city
let currentCity = getCookie('city') || defaultCity;
fetchWeather(currentCity);

form.addEventListener("submit", e => {
  e.preventDefault();

  currentCity = input.value;

  // Save city in cookie for 1800 days
  setCookie('city', currentCity, 1800);

  fetchWeather(currentCity);

  msg.textContent = "";
  form.reset();
  input.focus();
});

// Update weather every X minutes
setInterval(() => {
  fetchWeather(currentCity);
}, refreshWeather * 60 * 1000); 