import assert from "node:assert/strict";
import { test } from "node:test";
import { utils as cloudinaryUtils } from "cloudinary";
import { cloudinaryEnv, runNextRequest, webhook } from "./helpers/cloudinary.mjs";

const route = "/api/cloudinary/webhook";
const url = `http://localhost${route}`;
const secret = "test-webhook-secret";
const timestamp = 1_800_000_000;
const maxBytes = 1024 * 1024;
const mediaEvent = JSON.stringify({ asset_folder: "media", public_id: "unrelated/photo", context: "冬" });

function setup(t, folders = {}) {
  cloudinaryEnv(t, { CLOUDINARY_API_SECRET: secret, ...folders });
  t.mock.method(Date, "now", () => timestamp * 1000);
}

function signedHeaders(body, signedAt = timestamp) {
  return {
    "x-cld-signature": cloudinaryUtils.webhook_signature(body, signedAt, { api_secret: secret }),
    "x-cld-timestamp": String(signedAt),
  };
}

function signed(body) {
  return new Request(url, { method: "POST", body, headers: signedHeaders(body) });
}

function streamed(chunks, headers) {
  let reads = 0;
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      if (reads === chunks.length) controller.close();
      else controller.enqueue(chunks[reads++]);
    },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });

  return {
    request: new Request(url, { method: "POST", body, headers, duplex: "half" }),
    get reads() { return reads; },
    get cancelled() { return cancelled; },
  };
}

async function check(request, status, revalidated) {
  const { result, revalidations } = await runNextRequest(route, {}, () => webhook.POST(request), "action");
  assert.equal(result.status, status);
  if (status === 200) assert.deepEqual(await result.json(), { revalidated });
  assert.deepEqual(revalidations.map(({ tag, profile }) => [tag, profile]),
    revalidated ? [["gallery-assets", "max"]] : []);
}

test("Cloudinary webhook matches the Media Library folder from the shared configuration", async (t) => {
  setup(t, { CLOUDINARY_GALLERY_FOLDER: "media", CLOUDINARY_FOLDER: "fixed" });
  await check(signed(mediaEvent), 200, true);
  await check(signed('{"asset_folder":"other","public_id":"media/photo"}'), 200, false);
});

test("Cloudinary webhook matches fixed folders on a public ID path boundary", async (t) => {
  setup(t, { CLOUDINARY_FOLDER: "fixed" });
  await check(signed('{"public_id":"fixed/2026/photo"}'), 200, true);
  await check(signed('{"public_id":"fixed-archive/photo"}'), 200, false);
  await check(signed('{"asset_folder":"fixed"}'), 200, false);
});

test("Cloudinary webhook authenticates the original bytes across stream chunks", async (t) => {
  setup(t, { CLOUDINARY_GALLERY_FOLDER: "media" });
  const bytes = Buffer.from(mediaEvent);
  const split = bytes.indexOf(Buffer.from("冬")) + 1;
  const body = streamed([bytes.subarray(0, split), bytes.subarray(split)], signedHeaders(mediaEvent));
  await check(body.request, 200, true);
});

test("Cloudinary webhook rejects invalid headers before reading the body", async (t) => {
  setup(t);
  const bytes = [Buffer.from(mediaEvent)];
  const malformed = streamed(bytes, { ...signedHeaders(mediaEvent), "x-cld-signature": "invalid" });
  const expired = streamed(bytes, signedHeaders(mediaEvent, timestamp - 7201));
  const future = streamed(bytes, signedHeaders(mediaEvent, timestamp + 7201));
  for (const body of [malformed, expired, future]) {
    await check(body.request, 401);
    assert.equal(body.reads, 0);
  }
});

test("Cloudinary webhook checks the signature before processing JSON", async (t) => {
  setup(t);
  const tampered = new Request(url, { method: "POST", body: "{", headers: signedHeaders(mediaEvent) });
  await check(tampered, 401);
  await check(signed("{"), 400);
  await check(signed("[]"), 400);
  await check(signed("null"), 400);
});

test("Cloudinary webhook rejects an oversized Content-Length without reading", async (t) => {
  setup(t);
  const body = streamed([Buffer.from(mediaEvent)], {
    ...signedHeaders(mediaEvent), "content-length": String(maxBytes + 1),
  });
  await check(body.request, 413);
  assert.equal(body.reads, 0);
});

test("Cloudinary webhook enforces the byte limit while streaming", async (t) => {
  setup(t, { CLOUDINARY_GALLERY_FOLDER: "media" });
  const prefix = '{"asset_folder":"media","extra":"';
  const suffix = '"}';
  const text = prefix + "x".repeat(maxBytes - Buffer.byteLength(prefix + suffix)) + suffix;
  const bytes = Buffer.from(text);
  const accepted = streamed([bytes], signedHeaders(text));
  await check(accepted.request, 200, true);

  const rejected = streamed([bytes, Buffer.from(" "), Buffer.from("more")], signedHeaders(text));
  await check(rejected.request, 413);
  assert.equal(rejected.reads, 2);
  assert.equal(rejected.cancelled, true);
});
