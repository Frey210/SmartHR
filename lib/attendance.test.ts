import assert from "node:assert/strict";
import test from "node:test";
import { attendanceStatusLabel, formatElapsedDuration } from "./attendance.ts";

test("attendance correction states are never shown as completed sessions", () => {
  assert.equal(attendanceStatusLabel("PENDING", null), "Menunggu admin");
  assert.equal(attendanceStatusLabel("INCOMPLETE", null), "Perlu koreksi");
  assert.equal(attendanceStatusLabel("REJECTED", null), "Ditolak");
  assert.equal(attendanceStatusLabel("CLOSED", 95), "1j 35m");
});

test("live attendance duration is formatted as stable hours, minutes, and seconds", () => {
  assert.equal(formatElapsedDuration(1_000, 3_662_000), "01:01:01");
  assert.equal(formatElapsedDuration(1_000, 61_000, 90), "01:31:00");
  assert.equal(formatElapsedDuration(2_000, 1_000), "00:00:00");
});
