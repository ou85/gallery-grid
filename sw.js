const SHELL_CACHE = "gallery-grid-shell-v1";
const RUNTIME_CACHE = "gallery-grid-runtime-v1";

const SHELL_FILES = [
  "/",
  "/index.html",
  "/pages/cloud-grid.html",
  "/pages/list.html",
  "/pages/small-grid.html",
  "/pictures/1.jpg",
  "/scripts/clock.js",
  "/scripts/cloud-clock.js",
  "/scripts/cloud-grid.js",
  "/scripts/gallery.js",
  "/scripts/list.js",
  "/scripts/small-grid.js",
  "/scripts/weather.js",
  "/styles/cloud-grid.css",
  "/styles/fontcss.css",
  "/styles/list.css",
  "/styles/small-grid.css",
  "/styles/style.css",
  "/styles/styles.css",
  "/styles/TitilliumWeb.woff2",
  "/pictures.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (SHELL_FILES.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) =>
      cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});