import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "./password.ts";

test("password hashes verify only the original password", async () => {
  const hash = await hashPassword("AmanSekali123!");
  assert.equal(await verifyPassword("AmanSekali123!", hash), true);
  assert.equal(await verifyPassword("salah", hash), false);
  assert.equal(hash.includes("AmanSekali123!"), false);
});
