import assert from "node:assert/strict";
import test from "node:test";
import { attendanceStatusLabel, formatElapsedDuration, isAttendanceDayExpired } from "./attendance.ts";

test("attendance correction states are never shown as completed sessions", () => {
  assert.equal(attendanceStatusLabel("PENDING", null), "Menunggu verifikasi");
  assert.equal(attendanceStatusLabel("INCOMPLETE", null), "Perlu koreksi");
  assert.equal(attendanceStatusLabel("REJECTED", null), "Ditolak");
  assert.equal(attendanceStatusLabel("CLOSED", 95), "1j 35m");
});

test("open duration resets at company midnight, including already completed daily minutes", () => {
  const start = Date.parse("2026-10-23T15:00:00Z");
  const before = Date.parse("2026-10-23T15:59:59Z");
  const midnight = Date.parse("2026-10-23T16:00:00Z");
  assert.equal(formatElapsedDuration(start, before, 120, "Asia/Makassar"), "02:59:59");
  assert.equal(formatElapsedDuration(start, midnight, 120, "Asia/Makassar"), "00:00:00");
  assert.equal(isAttendanceDayExpired(start, midnight, "Asia/Jakarta"), false);
  assert.equal(isAttendanceDayExpired(start, Date.parse("2026-10-24T17:00:00Z"), "Asia/Jakarta"), true);
  assert.equal(formatElapsedDuration(start, start + 500 * 3_600_000, 0, "Asia/Makassar"), "00:00:00");
});

test("live attendance duration is formatted as stable hours, minutes, and seconds", () => {
  assert.equal(formatElapsedDuration(1_000, 3_662_000), "01:01:01");
  assert.equal(formatElapsedDuration(1_000, 61_000, 90), "01:31:00");
  assert.equal(formatElapsedDuration(2_000, 1_000), "00:00:00");
});
