const CACHE = "gallery-grid-next-v1";
const SHELL = ["/", "/cloud-grid", "/list", "/small-grid"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && (new URL(event.request.url).origin === location.origin || event.request.url.includes("res.cloudinary.com"))) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => cached)));
});
