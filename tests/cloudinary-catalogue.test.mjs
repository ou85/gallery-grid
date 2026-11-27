import assert from "node:assert/strict";
import { test } from "node:test";
import { v2 as cloudinary } from "cloudinary";
import { catalogue, cloudinaryEnv, runNextRequest } from "./helpers/cloudinary.mjs";

const { getCloudinaryCatalogue, getGalleryCatalogue, getLegacyImages } = catalogue;
const credentials = {
  CLOUDINARY_CLOUD_NAME: "test-cloud",
  CLOUDINARY_API_KEY: "test-key",
  CLOUDINARY_API_SECRET: "test-secret",
};

const photo = (id) => ({ asset_id: id, secure_url: `https://res.cloudinary.com/test-cloud/image/upload/${id}.jpg` });
const pages = (...resources) => ({ resources });
const fail = () => { throw new Error("Cloudinary connection failed"); };
const notFound = () => { throw { error: { http_code: 404 } }; };
const ids = ({ images }) => images.map(({ id }) => id);

function mockCloudinary(t, handlers = {}) {
  t.mock.method(cloudinary, "config", () => {});
  return Object.fromEntries(["resources_by_asset_folder", "resources", "config"].map((method) => {
    const handler = handlers[method];
    const mock = t.mock.method(cloudinary.api, method, handler ?? fail);
    if (!handler) t.after(() => assert.equal(mock.mock.callCount(), 0, `Unexpected Cloudinary ${method} call`));
    return [method, mock.mock];
  }));
}

function createCatalogueCache() {
  const entries = new Map();
  const writes = [];
  let isStale = false;
  const backend = {
    generateSimpleCacheKey: async (key) => key,
    get: async (key) => entries.has(key) ? { value: entries.get(key), isStale } : null,
    set: async (key, value) => {
      entries.set(key, value);
      writes.push(JSON.parse(value.data.body).map(({ id }) => id));
      isStale = false;
    },
  };

  return {
    writes,
    expire() { isStale = true; },
    async load(run = getCloudinaryCatalogue) {
      return (await runNextRequest("/gallery", backend, run)).result;
    },
  };
}

test("Cloudinary catalogue skips requests and caching without credentials", async (t) => {
  cloudinaryEnv(t, { ...credentials, CLOUDINARY_API_SECRET: undefined });
  mockCloudinary(t);
  const cache = createCatalogueCache();
  assert.deepEqual(await cache.load(), { status: "unconfigured", images: [] });
  assert.deepEqual(cache.writes, []);
});

test("Cloudinary catalogue caches a successful empty Media Library folder", async (t) => {
  cloudinaryEnv(t, credentials);
  const sdk = mockCloudinary(t, { resources_by_asset_folder: () => pages() });
  const cache = createCatalogueCache();
  for (let visit = 0; visit < 2; visit++) {
    assert.deepEqual(await cache.load(), { status: "available", images: [] });
  }
  assert.equal(sdk.resources_by_asset_folder.callCount(), 1);
  assert.equal(sdk.resources_by_asset_folder.calls[0].arguments[0], "gallery");
  assert.deepEqual(cache.writes, [[]]);
});

test("Cloudinary catalogue reads all pages of the configured public ID prefix", async (t) => {
  cloudinaryEnv(t, { ...credentials, CLOUDINARY_FOLDER: "fixed" });
  const sdk = mockCloudinary(t, {
    resources: ({ next_cursor }) => next_cursor
      ? pages(photo("second"))
      : { ...pages(photo("first")), next_cursor: "page-2" },
  });
  const cache = createCatalogueCache();
  assert.deepEqual(ids(await cache.load()), ["first", "second"]);
  assert.deepEqual(sdk.resources.calls.map(({ arguments: [options] }) => [options.prefix, options.next_cursor]), [
    ["fixed/", undefined], ["fixed/", "page-2"],
  ]);
});

test("Cloudinary outage on a cold cache still returns the built-in catalogue", async (t) => {
  cloudinaryEnv(t, { ...credentials, CLOUDINARY_FOLDER: "fixed" });
  const sdk = mockCloudinary(t, { resources: fail });
  t.mock.method(console, "error", () => {});
  const cache = createCatalogueCache();
  assert.deepEqual(await cache.load(), { status: "unavailable", images: [] });
  const combined = await cache.load(getGalleryCatalogue);
  assert.equal(combined.cloudCount, 0);
  assert.deepEqual(
    combined.images.map(({ originalUrl }) => originalUrl),
    [...new Set(getLegacyImages().map(({ originalUrl }) => originalUrl))],
  );
  assert.deepEqual(cache.writes, []);
  assert.equal(sdk.resources.callCount(), 2);
});

test("Cloudinary second-page network failure discards the partial result", async (t) => {
  cloudinaryEnv(t, credentials);
  const sdk = mockCloudinary(t, {
    resources_by_asset_folder: (_folder, { next_cursor }) => next_cursor
      ? fail()
      : { ...pages(photo("partial")), next_cursor: "page-2" },
  });
  t.mock.method(console, "error", () => {});
  const cache = createCatalogueCache();
  assert.deepEqual(await cache.load(), { status: "unavailable", images: [] });
  assert.equal(sdk.resources_by_asset_folder.callCount(), 2);
  assert.deepEqual(cache.writes, []);
});

test("Cloudinary starts prefix lookup from scratch when the account confirms fixed folders", async (t) => {
  cloudinaryEnv(t, { ...credentials, CLOUDINARY_GALLERY_FOLDER: "media", CLOUDINARY_FOLDER: "fixed" });
  const sdk = mockCloudinary(t, {
    resources_by_asset_folder: (_folder, { next_cursor }) => next_cursor
      ? notFound()
      : { ...pages(photo("partial")), next_cursor: "page-2" },
    config: () => ({ settings: { folder_mode: "fixed" } }),
    resources: () => pages(photo("complete")),
  });
  const cache = createCatalogueCache();
  assert.deepEqual(ids(await cache.load()), ["complete"]);
  assert.deepEqual(sdk.config.calls[0].arguments, [{ settings: true }]);
  assert.deepEqual(sdk.resources.calls.map(({ arguments: [options] }) => [options.prefix, options.next_cursor]), [
    ["media/", undefined],
  ]);
  assert.deepEqual(cache.writes, [["complete"]]);
});

test("Cloudinary does not use prefix lookup for a 404 in dynamic folder mode", async (t) => {
  cloudinaryEnv(t, credentials);
  mockCloudinary(t, {
    resources_by_asset_folder: notFound,
    config: () => ({ settings: { folder_mode: "dynamic" } }),
  });
  t.mock.method(console, "error", () => {});
  const cache = createCatalogueCache();
  assert.deepEqual(await cache.load(), { status: "unavailable", images: [] });
  assert.deepEqual(cache.writes, []);
});

test("Cloudinary keeps stale photos after a failed refresh and replaces them after recovery", async (t) => {
  cloudinaryEnv(t, { ...credentials, CLOUDINARY_FOLDER: "fixed" });
  let attempt = 0;
  const sdk = mockCloudinary(t, {
    resources: () => {
      attempt++;
      if (attempt === 2) return fail();
      return pages(photo(attempt === 1 ? "previous" : "recovered"));
    },
  });
  t.mock.method(console, "error", () => {});
  const cache = createCatalogueCache();
  assert.deepEqual(ids(await cache.load()), ["previous"]);
  cache.expire();
  assert.deepEqual(ids(await cache.load()), ["previous"]);
  assert.deepEqual(cache.writes, [["previous"]]);
  assert.equal(sdk.resources.callCount(), 2);

  assert.deepEqual(ids(await cache.load()), ["previous"]);
  assert.deepEqual(ids(await cache.load()), ["recovered"]);
  assert.deepEqual(cache.writes, [["previous"], ["recovered"]]);
  assert.equal(sdk.resources.callCount(), 3);
});
