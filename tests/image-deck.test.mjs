import assert from "node:assert/strict";
import { test } from "node:test";
import { GalleryRotation, ImageDeck, repeatDelayMs } from "../components/image-deck.ts";

const images = [{ id: "lake" }, { id: "forest" }, { id: "coast" }];

test("rotation visits every image once per cycle without mutating the source", () => {
  const deck = new ImageDeck(images);
  const ids = images.map(({ id }) => id);
  for (let cycle = 0; cycle < 2; cycle++) {
    const drawn = Array.from({ length: images.length }, () => deck.next().id);
    assert.deepEqual(new Set(drawn), new Set(ids));
  }
  assert.deepEqual(images.map(({ id }) => id), ids);
});

test("rotation skips displayed images when an eligible image remains", (t) => {
  t.mock.method(Math, "random", () => 0.99);
  const deck = new ImageDeck(images);
  assert.equal(deck.next(["coast", "forest"]).id, "lake");
  assert.equal(deck.next(["coast"]).id, "forest");
});

test("an exhausted deck returns no candidate when every image is excluded", () => {
  const deck = new ImageDeck([images[0]]);
  assert.equal(deck.next(), images[0]);
  assert.equal(deck.next([images[0].id]), undefined);
});

test("a blocked tail can roll over to an eligible image without drawing a duplicate", (t) => {
  t.mock.method(Math, "random", () => 0.99);
  const deck = new ImageDeck(images);
  assert.equal(deck.next().id, "coast");
  assert.equal(deck.next(["forest", "lake"]).id, "coast");
  assert.equal(deck.next(["coast", "forest", "lake"]), undefined);
});

test("rotation starts the cooldown when the outgoing frame finishes and honors it across a new deck", (t) => {
  t.mock.method(Math, "random", () => 0.99);
  const rotation = new GalleryRotation(images);
  rotation.resize(2, 0);
  assert.deepEqual(rotation.snapshot().frames.map(({ id }) => id), ["coast", "forest"]);
  assert.equal(rotation.advance(30_000), true);
  const { pending } = rotation.snapshot();
  assert.equal(pending.image.id, "lake");
  assert.equal(rotation.advance(30_500), false);
  const finishedAt = 31_000;
  assert.equal(rotation.settle(pending, true, finishedAt), true);
  assert.equal(rotation.advance(finishedAt + repeatDelayMs - 1), false);
  assert.equal(rotation.advance(finishedAt + repeatDelayMs), true);
  assert.equal(rotation.snapshot().pending.image.id, "forest");
});

test("resizing 9 to 8 to 9 preserves the visible frames and does not immediately return the removed photo", (t) => {
  t.mock.method(Math, "random", () => 0.99);
  const rotation = new GalleryRotation(Array.from({ length: 10 }, (_, id) => ({ id: String(id) })));
  rotation.resize(9, 0);
  const before = rotation.snapshot().frames;
  rotation.resize(8, 1_000);
  assert.deepEqual(rotation.snapshot().frames, before.slice(0, 8));
  rotation.resize(9, 2_000);
  const after = rotation.snapshot().frames;
  assert.deepEqual(after.slice(0, 8), before.slice(0, 8));
  assert.equal(after.length, 9);
  assert(!before.includes(after[8]));
});

test("resizing while a photo loads preserves its reservation or ignores a cancelled transition", (t) => {
  t.mock.method(Math, "random", () => 0.99);
  const rotation = new GalleryRotation([...images, { id: "desert" }, { id: "snow" }]);
  rotation.resize(2, 0);
  rotation.advance(30_000);
  const { pending } = rotation.snapshot();
  rotation.resize(3, 30_100);
  assert.equal(rotation.snapshot().pending, pending);
  assert.equal(new Set(rotation.snapshot().frames.map(({ id }) => id)).size, 3);
  rotation.resize(1, 30_200);
  assert.equal(rotation.snapshot().pending, undefined);
  assert.equal(rotation.settle(pending, true, 30_800), false);
  rotation.resize(3, 31_000);
  assert(!rotation.snapshot().frames.includes(pending.image));
});

test("a failed image keeps the current photo and does not stall the next rotation", (t) => {
  t.mock.method(Math, "random", () => 0.99);
  const rotation = new GalleryRotation([...images, { id: "desert" }]);
  rotation.resize(2, 0);
  const before = rotation.snapshot().frames;
  rotation.advance(30_000);
  assert.equal(rotation.settle(rotation.snapshot().pending, false, 30_500), true);
  assert.deepEqual(rotation.snapshot().frames, before);
  assert.equal(rotation.advance(60_000), true);
  assert.notEqual(rotation.snapshot().pending.image.id, "forest");
});
