import assert from "node:assert/strict";
import test from "node:test";
import { monthRange } from "./month.ts";

test("month range validates input and handles leap years", () => {
  assert.deepEqual(monthRange("2028-02", "2026-10"), { month: "2028-02", start: "2028-02-01", end: "2028-02-29" });
  assert.deepEqual(monthRange("invalid", "2026-10"), { month: "2026-10", start: "2026-10-01", end: "2026-10-31" });
});
