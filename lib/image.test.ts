import assert from "node:assert/strict";
import test from "node:test";
import { imageExtension, matchesImageMime } from "./image.ts";

test("supported image MIME types map to safe file extensions", () => {
  assert.equal(imageExtension("image/jpeg"), "jpg");
  assert.equal(imageExtension("image/png"), "png");
  assert.equal(imageExtension("image/webp"), "webp");
  assert.equal(imageExtension("image/heic"), undefined);
});

test("image signatures must match the declared MIME type", () => {
  assert.equal(matchesImageMime(Uint8Array.from([0xff, 0xd8, 0xff]), "image/jpeg"), true);
  assert.equal(matchesImageMime(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"), true);
  assert.equal(matchesImageMime(new TextEncoder().encode("RIFF0000WEBP"), "image/webp"), true);
  assert.equal(matchesImageMime(new TextEncoder().encode("<script>"), "image/webp"), false);
});
