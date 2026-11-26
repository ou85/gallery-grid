const form = document.querySelector(".bottom-banner form");
const input = document.querySelector(".bottom-banner input");
const msg = document.querySelector(".bottom-banner .msg");
const list = document.querySelector(".ajax-section .cities");

const item = document.createElement("li");
item.className = "city";
item.innerHTML = `
  <div class="city-info">
    <h2 class="city-name"><span></span><sup></sup></h2>
    <div class="city-temp"><span></span><sup>°C</sup></div>
    <figcaption></figcaption>
    <figure><img class="city-icon" alt=""></figure>
  </div>
`;
list.appendChild(item);
item.hidden = true;
input.maxLength = 100;

function savedCity() {
  const value = document.cookie.match(/(?:^|; )city=([^;]*)/)?.[1];
  try {
    const city = value ? decodeURIComponent(value).trim() : "";
    return city && city.length <= 100 ? city : "Stockholm";
  } catch {
    return "Stockholm";
  }
}

let currentCity = savedCity();
let activeRequest;

async function fetchWeather() {
  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;

  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(currentCity)}`, {
      signal: request.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      if (!request.signal.aborted) {
        msg.textContent = response.status === 404 ? "City not found" : "Weather is temporarily unavailable";
      }
      return;
    }

    const { main, name, sys, weather } = await response.json();
    if (request.signal.aborted) return;

    const heading = item.querySelector(".city-name");
    heading.dataset.name = `${name},${sys.country}`;
    heading.querySelector("span").textContent = name;
    heading.querySelector("sup").textContent = sys.country;
    item.querySelector(".city-temp span").textContent = Math.round(main.temp);
    item.querySelector("figcaption").textContent = weather[0].description;
    const icon = item.querySelector("img");
    icon.src = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
    icon.alt = weather[0].description;
    item.hidden = false;
    msg.textContent = "";
  } catch {
    if (!request.signal.aborted) msg.textContent = "Weather is temporarily unavailable";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = input.value.trim();
  if (!city || city.length > 100) return;

  currentCity = city;
  document.cookie = `city=${encodeURIComponent(city)}; max-age=155520000; SameSite=Lax; path=/`;
  msg.textContent = "Loading weather…";
  void fetchWeather();
  form.reset();
  input.focus();
});

void fetchWeather();
setInterval(fetchWeather, 900_000);
