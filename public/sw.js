const PAGE_CACHE = "gallery-grid-next-v2-pages";
const ASSET_CACHE = "gallery-grid-next-v2-assets";
const OLD_CACHES = ["gallery-grid-next-v1", "gallery-grid-shell-v2", "gallery-grid-runtime-v2"];
const PAGES = new Set(["/", "/cloud-grid", "/time-grid", "/gallery", "/list", "/small-grid"]);
const ASSET_LIMIT = 80;

self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await Promise.all(OLD_CACHES.map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function readCache(name, request) {
  try {
    return await (await caches.open(name)).match(request);
  } catch {
    return undefined;
  }
}

async function saveResponse(name, request, response, limit) {
  if (!response.ok || response.redirected) return;
  const cache = await caches.open(name);
  await cache.put(request, response);
  if (!limit) return;
  const keys = await cache.keys();
  const overflow = keys.length - limit;
  if (overflow > 0) await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
}

function servePage(event) {
  const { request } = event;
  const network = fetch(request, { cache: "no-cache" });
  // These public routes can be kept as offline snapshots even when HTTP caching is disabled.
  event.waitUntil(network.then((response) => {
    if (response.headers.get("content-type")?.startsWith("text/html")) {
      return saveResponse(PAGE_CACHE, request, response.clone());
    }
  }).catch(() => {}));

  event.respondWith(network.catch(async () => {
    return await readCache(PAGE_CACHE, request) ?? new Response(
      "Gallery Grid is offline. Connect to the internet to open this page.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }));
}

function serveAsset(event) {
  const { request } = event;
  const cached = readCache(ASSET_CACHE, request);
  const network = cached.then((response) => response ? undefined : fetch(request));
  event.waitUntil(network.then((response) => {
    if (response) return saveResponse(ASSET_CACHE, request, response.clone(), ASSET_LIMIT);
  }).catch(() => {}));
  event.respondWith(cached.then(async (response) => response ?? await network));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.search) return;

  if (request.mode === "navigate" && PAGES.has(url.pathname)) {
    servePage(event);
  } else if (url.pathname.startsWith("/_next/static/") && !request.headers.has("range")) {
    serveAsset(event);
  }
});
