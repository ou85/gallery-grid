import assert from "node:assert/strict";
import { test } from "node:test";
import { GalleryRotation } from "../components/image-deck.ts";
import { createTimeGridCells, moveTimeCard } from "../components/time-grid-layout.ts";

const photoSlots = Array.from({ length: 10 }, (_, index) => index);

test("Time Grid always places two distinct cards and all ten photo slots", () => {
  assert.deepEqual(createTimeGridCells(10, () => 0.999), [...photoSlots, "time", "date"]);
  let cells = createTimeGridCells(10, () => 0);
  for (let index = 0; index < 50; index++) {
    const card = index % 2 === 0 ? "time" : "date";
    const previous = cells;
    cells = moveTimeCard(previous, card, (index % 10) / 10);

    assert.equal(cells.length, 12);
    assert.deepEqual(new Set(cells), new Set([...photoSlots, "time", "date"]));
    assert.notEqual(cells.indexOf(card), previous.indexOf(card));
    assert.equal(cells.indexOf(card === "time" ? "date" : "time"), previous.indexOf(card === "time" ? "date" : "time"));
    assert.equal(cells.filter((cell, position) => cell !== previous[position]).length, 2);
  }
});

test("a time card without a photo to swap stays in place", () => {
  const cells = createTimeGridCells(0, () => 0);
  assert.deepEqual(new Set(cells), new Set(["time", "date"]));
  assert.equal(moveTimeCard(cells, "time", 0.5), cells);
});

test("swapping a card changes position without restarting photo rotation or its cooldown", (t) => {
  t.mock.method(Math, "random", () => 0.99);
  const rotation = new GalleryRotation(Array.from({ length: 11 }, (_, id) => ({ id: String(id) })));
  rotation.resize(10, 0);
  rotation.advance(15_000);
  const transition = rotation.snapshot().pending;
  rotation.settle(transition, true, 16_000);

  const before = rotation.snapshot().frames;
  const cells = moveTimeCard(createTimeGridCells(10), "date", 0.5);
  const photos = cells.filter((cell) => typeof cell === "number").map((slot) => before[slot]);
  assert.equal(new Set(photos).size, 10);
  assert.deepEqual(new Set(photos), new Set(before));
  assert.equal(rotation.advance(60_000), false);
  assert.deepEqual(rotation.snapshot().frames, before);
});
