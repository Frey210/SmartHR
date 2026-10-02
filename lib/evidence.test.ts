import assert from "node:assert/strict";
import test from "node:test";
import { evidenceDescriptions } from "./evidence.ts";

test("every evidence photo must have exactly one description", () => {
  assert.deepEqual(evidenceDescriptions(2, ["Pemasangan kabel", "Pengujian koneksi"]), ["Pemasangan kabel", "Pengujian koneksi"]);
  assert.equal(evidenceDescriptions(2, ["Satu deskripsi"]), null);
  assert.equal(evidenceDescriptions(1, ["   "]), null);
});
