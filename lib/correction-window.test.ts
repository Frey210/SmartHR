import assert from "node:assert/strict";
import test from "node:test";
import { isCorrectionWithinWindow } from "./correction-window.ts";

test("one-day correction limit includes yesterday until the end of today in company time", () => {
  const start = new Date("2026-10-25T16:00:00Z");
  assert.equal(isCorrectionWithinWindow(start, 1, "Asia/Makassar", new Date("2026-10-27T15:59:59Z")), true);
  assert.equal(isCorrectionWithinWindow(start, 1, "Asia/Makassar", new Date("2026-10-27T16:00:00Z")), false);
  assert.equal(isCorrectionWithinWindow(start, 1, "Asia/Jakarta", new Date("2026-10-27T15:59:59Z")), false);
});

test("three days, disabled limits, month boundaries and future dates", () => {
  const now = new Date("2026-11-01T04:00:00Z");
  assert.equal(isCorrectionWithinWindow(new Date("2026-10-29T00:00:00Z"), 3, "Asia/Makassar", now), true);
  assert.equal(isCorrectionWithinWindow(new Date("2026-10-28T00:00:00Z"), 3, "Asia/Makassar", now), false);
  assert.equal(isCorrectionWithinWindow(new Date("2025-01-01T00:00:00Z"), null, "Asia/Makassar", now), true);
  assert.equal(isCorrectionWithinWindow(new Date("2026-11-02T00:00:00Z"), null, "Asia/Makassar", now), false);
});

test("calendar days do not become 24-hour windows during daylight saving changes", () => {
  assert.equal(isCorrectionWithinWindow(new Date("2026-03-08T05:00:00Z"), 1, "America/New_York", new Date("2026-03-10T03:59:59Z")), true);
  assert.equal(isCorrectionWithinWindow(new Date("2026-03-08T05:00:00Z"), 1, "America/New_York", new Date("2026-03-10T04:00:00Z")), false);
});
