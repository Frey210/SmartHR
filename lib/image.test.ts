import assert from "node:assert/strict";
import test from "node:test";
import { matchesImageMime } from "./image.ts";

test("image signatures must match the declared MIME type", () => {
  assert.equal(matchesImageMime(Uint8Array.from([0xff, 0xd8, 0xff]), "image/jpeg"), true);
  assert.equal(matchesImageMime(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"), true);
  assert.equal(matchesImageMime(new TextEncoder().encode("RIFF0000WEBP"), "image/webp"), true);
  assert.equal(matchesImageMime(new TextEncoder().encode("<script>"), "image/webp"), false);
});
