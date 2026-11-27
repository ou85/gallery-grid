import { createRequire, registerHooks } from "node:module";

const require = createRequire(import.meta.url);
// Keep Next's cache and revalidation logic real while running routes in-process.
require("next/dist/server/node-environment-baseline");
const { workAsyncStorage } = require("next/dist/server/app-render/work-async-storage.external");
const { workUnitAsyncStorage } = require("next/dist/server/app-render/work-unit-async-storage.external");

const aliases = new Map([
  ["@/images", "../../images.js"],
  ["@/lib/cloudinary-folder", "../../lib/cloudinary-folder.ts"],
  ["@/lib/cloudinary-image-url", "../../lib/cloudinary-image-url.ts"],
]);
const entryPoints = new Set([
  new URL("../../lib/gallery-assets.ts", import.meta.url).href,
  new URL("../../app/api/cloudinary/webhook/route.ts", import.meta.url).href,
]);
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (entryPoints.has(context.parentURL)) {
      const alias = aliases.get(specifier);
      if (alias) return nextResolve(new URL(alias, import.meta.url).href, context);
      if (specifier === "next/cache" || specifier === "next/server") {
        return nextResolve(`${specifier}.js`, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

const [catalogue, webhook] = await Promise.all([
  import("../../lib/gallery-assets.ts"),
  import("../../app/api/cloudinary/webhook/route.ts"),
]).finally(() => hooks.deregister());

export { catalogue, webhook };

export async function runNextRequest(route, incrementalCache, run, phase = "render") {
  const store = { route, incrementalCache, cacheLifeProfiles: { max: { expire: Infinity } } };
  const request = { type: "request", phase, url: { pathname: route, search: "" } };
  const result = await workAsyncStorage.run(store, () => workUnitAsyncStorage.run(request, run));
  await Promise.all(Object.values(store.pendingRevalidates ?? {}));
  return { result, revalidations: store.pendingRevalidatedTags ?? [] };
}

export function cloudinaryEnv(t, values) {
  const keys = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "CLOUDINARY_FOLDER",
    "CLOUDINARY_GALLERY_FOLDER",
  ];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const apply = (env) => {
    for (const key of keys) {
      if (env[key] === undefined) delete process.env[key];
      else process.env[key] = env[key];
    }
  };

  apply(values);
  t.after(() => apply(previous));
}
