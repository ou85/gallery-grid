import assert from "node:assert/strict";
import { test } from "node:test";
import { ImageDeck } from "../components/image-deck.ts";

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

test("a one-image catalogue can cycle without losing its only image", () => {
  const deck = new ImageDeck([images[0]]);
  assert.equal(deck.next(), images[0]);
  assert.equal(deck.next([images[0].id]), images[0]);
});
