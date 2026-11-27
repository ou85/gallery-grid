import assert from "node:assert/strict";
import { test } from "node:test";
import { paginateGallery } from "../lib/gallery-pagination.ts";

const images = Array.from({ length: 972 }, (_, index) => index);

test("list pagination keeps catalogue order and renders 60 photos per full page", () => {
  const first = paginateGallery(images, undefined);
  const second = paginateGallery(images, "2");
  assert.deepEqual(first, { page: 1, totalPages: 17, items: images.slice(0, 60) });
  assert.deepEqual(second, { page: 2, totalPages: 17, items: images.slice(60, 120) });
});

test("list pagination bounds the last page and safely handles malformed input", () => {
  assert.deepEqual(paginateGallery(images, "999"), { page: 17, totalPages: 17, items: images.slice(960) });
  for (const value of ["0", "-1", "1.5", "abc", ["1", "2"]]) {
    assert.equal(paginateGallery(images, value).page, 1);
  }
  assert.deepEqual(paginateGallery([], "2"), { page: 1, totalPages: 1, items: [] });
});
