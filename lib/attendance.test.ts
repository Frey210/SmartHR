import assert from "node:assert/strict";
import test from "node:test";
import { attendanceStatusLabel } from "./attendance.ts";

test("attendance correction states are never shown as completed sessions", () => {
  assert.equal(attendanceStatusLabel("PENDING", null), "Menunggu admin");
  assert.equal(attendanceStatusLabel("INCOMPLETE", null), "Perlu koreksi");
  assert.equal(attendanceStatusLabel("REJECTED", null), "Ditolak");
  assert.equal(attendanceStatusLabel("CLOSED", 95), "1j 35m");
});
