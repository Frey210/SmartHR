import assert from "node:assert/strict";
import test from "node:test";
import { dateTimeLocalValue } from "./date.ts";

test("datetime-local value follows the configured business timezone", () => {
  assert.equal(dateTimeLocalValue(new Date("2026-10-01T16:30:00Z"), "Asia/Singapore"), "2026-10-02T00:30");
});
