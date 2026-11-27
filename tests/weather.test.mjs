import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// Run the real route and provider while replacing the Next.js request cache.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/cache") {
      return {
        url: "data:text/javascript,export const unstable_cache = (callback) => callback;",
        shortCircuit: true,
      };
    }
    if (specifier === "@/lib/weather") {
      return nextResolve(new URL("../lib/weather.ts", import.meta.url).href, context);
    }
    return nextResolve(specifier === "next/server" ? "next/server.js" : specifier, context);
  },
});
const { GET } = await import("../app/api/weather/route.ts");
hooks.deregister();

const weather = {
  name: "New York",
  sys: { country: "US" },
  main: { temp: 16 },
  weather: [{ description: "clear sky", icon: "01d" }],
};

function request(city) {
  const url = new URL("http://localhost/api/weather");
  if (city !== undefined) url.searchParams.set("city", city);
  return GET(new Request(url));
}

function mockProvider(t, handler, configured = true) {
  const previousKey = process.env.OPENWEATHER_API_KEY;
  if (configured) process.env.OPENWEATHER_API_KEY = "test-only-key";
  else delete process.env.OPENWEATHER_API_KEY;

  t.after(() => {
    if (previousKey === undefined) delete process.env.OPENWEATHER_API_KEY;
    else process.env.OPENWEATHER_API_KEY = previousKey;
  });
  return t.mock.method(globalThis, "fetch", handler);
}

test("weather validates city input before making an upstream request", async (t) => {
  const upstream = mockProvider(t, () => assert.fail("Unexpected upstream request"));
  for (const city of [undefined, "  ", "x".repeat(101)]) {
    assert.equal((await request(city)).status, 400);
  }
  assert.equal(upstream.mock.callCount(), 0);
});

test("weather normalizes the city and returns only the public fields", async (t) => {
  const upstream = mockProvider(t, (url, options) => {
    assert.equal(url.origin, "https://api.openweathermap.org");
    assert.equal(url.searchParams.get("q"), "new york");
    assert.equal(url.searchParams.get("units"), "metric");
    assert.equal(options.cache, "no-store");
    return Response.json({ ...weather, privateFixture: "not returned" });
  });
  const response = await request(" New   York ");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), weather);
  assert.equal(upstream.mock.callCount(), 1);
});

test("weather distinguishes an unknown city from an upstream failure", async (t) => {
  mockProvider(t, (url) => {
    const status = url.searchParams.get("q") === "unknown" ? 404 : 429;
    return new Response(null, { status });
  });
  assert.equal((await request("Unknown")).status, 404);
  assert.equal((await request("Stockholm")).status, 502);
});

test("weather rejects malformed provider data", async (t) => {
  mockProvider(t, () => Response.json({ ...weather, weather: [] }));
  const response = await request("Stockholm");
  assert.equal(response.status, 502);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("weather returns 503 without configuration and makes no upstream request", async (t) => {
  const upstream = mockProvider(t, () => assert.fail("Unexpected upstream request"), false);
  assert.equal((await request("Stockholm")).status, 503);
  assert.equal(upstream.mock.callCount(), 0);
});

test("weather reports an aborted upstream timeout as 504", async (t) => {
  const timeout = t.mock.method(AbortSignal, "timeout", () => AbortSignal.abort());
  mockProvider(t, (_url, { signal }) => signal.throwIfAborted());
  const response = await request("Stockholm");
  assert.equal(response.status, 504);
  assert.deepEqual(timeout.mock.calls[0].arguments, [5_000]);
});
