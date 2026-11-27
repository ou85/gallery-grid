import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const origin = "https://gallery.test";

function setup({ cacheNames = [], fetch = () => { throw new Error("Offline"); } } = {}) {
  const listeners = new Map();
  const stores = new Map(cacheNames.map((name) => [name, new Map()]));
  const lifecycle = [];
  const caches = {
    delete: async (name) => stores.delete(name),
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        match: async (request) => entries.get(request.url)?.clone(),
        put: async (request, response) => entries.set(request.url, response),
        keys: async () => [...entries.keys()].map((url) => ({ url })),
        delete: async (request) => entries.delete(request.url),
      };
    },
  };
  const self = {
    location: { origin },
    async skipWaiting() { lifecycle.push("skipWaiting"); },
    clients: { async claim() { lifecycle.push("claim"); } },
    addEventListener: (name, listener) => listeners.set(name, listener),
  };
  runInNewContext(script, {
    self, caches, URL, Response,
    fetch: async (...args) => fetch(...args),
  });

  return {
    stores,
    lifecycle,
    run(name) {
      let completion;
      listeners.get(name)({ waitUntil: (promise) => { completion = promise; } });
      return completion;
    },
    async request(path, { mode = "navigate", method = "GET", headers = {} } = {}) {
      let completion, response;
      listeners.get("fetch")({
        request: { url: new URL(path, origin).href, mode, method, headers: new Headers(headers) },
        waitUntil: (promise) => { completion = promise; },
        respondWith: (promise) => { response = promise; },
      });
      // A real worker keeps the response and cache write alive independently.
      const [result] = await Promise.all([response, completion]);
      return result;
    },
  };
}

function html(body) {
  return new Response(body, { headers: { "Content-Type": "text/html" } });
}

test("a new service worker takes control and removes only its legacy caches", async () => {
  const worker = setup({
    cacheNames: [
      "gallery-grid-next-v1", "gallery-grid-shell-v2", "gallery-grid-runtime-v2",
      "gallery-grid-next-v2-pages", "another-app",
    ],
  });
  await worker.run("install");
  await worker.run("activate");
  assert.deepEqual(worker.lifecycle, ["skipWaiting", "claim"]);
  assert.deepEqual([...worker.stores.keys()], ["gallery-grid-next-v2-pages", "another-app"]);
});

test("navigation prefers fresh HTML and uses the last successful snapshot offline", async () => {
  let version = "initial";
  const worker = setup({
    fetch: (_request, options) => {
      assert.equal(options.cache, "no-cache");
      if (version === "offline") throw new Error("Offline");
      if (version === "unavailable") return new Response(null, { status: 503 });
      return html(version);
    },
  });
  assert.equal(await (await worker.request("/list")).text(), "initial");
  version = "updated";
  assert.equal(await (await worker.request("/list")).text(), "updated");
  version = "unavailable";
  assert.equal((await worker.request("/list")).status, 503);
  version = "offline";
  assert.equal(await (await worker.request("/list")).text(), "updated");
  assert.equal((await worker.request("/gallery")).status, 503);
});

test("API, Next.js data, cross-origin and partial requests bypass the cache", async () => {
  const worker = setup({ fetch: () => assert.fail("The worker should not call fetch") });
  assert.equal(await worker.request("/api/weather?city=Stockholm", { mode: "cors" }), undefined);
  assert.equal(await worker.request("/api/weather"), undefined);
  assert.equal(await worker.request("/api/cloudinary/webhook", { method: "POST" }), undefined);
  assert.equal(await worker.request("/?_rsc=abc", { mode: "cors" }), undefined);
  assert.equal(await worker.request("https://res.cloudinary.com/demo/image/upload/sample.jpg"), undefined);
  assert.equal(await worker.request("/_next/static/chunks/main.js", { headers: { Range: "bytes=0-9" } }), undefined);
  assert.equal(worker.stores.size, 0);
});

test("build assets are reused and the oldest entry is evicted at the limit", async () => {
  let calls = 0;
  const worker = setup({ fetch: ({ url }) => { calls++; return new Response(url); } });
  const asset = (index) => worker.request(`/_next/static/chunks/${index}.js`, { mode: "cors" });
  for (let index = 0; index <= 80; index++) await asset(index);
  assert.equal(worker.stores.get("gallery-grid-next-v2-assets").size, 80);
  await asset(80);
  assert.equal(calls, 81);
  await asset(0);
  assert.equal(calls, 82);
});
