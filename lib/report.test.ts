import assert from "node:assert/strict";
import test from "node:test";
import { employeeAttendanceStats } from "./report.ts";

test("employeeAttendanceStats merangkum jam payroll per karyawan dan hari", () => {
  const employee = { name: "Ayu", username: "ayu", position: "Teknisi" };
  const stats = employeeAttendanceStats([
    { employeeId: "1", businessDate: "2026-10-01", status: "CLOSED", durationMinutes: 120, clockInAt: new Date("2026-10-01T00:00:00Z"), clockOutAt: new Date("2026-10-01T02:00:00Z"), employee },
    { employeeId: "1", businessDate: "2026-10-01", status: "CLOSED", durationMinutes: 60, clockInAt: new Date("2026-10-01T03:00:00Z"), clockOutAt: new Date("2026-10-01T04:00:00Z"), employee },
    { employeeId: "1", businessDate: "2026-10-02", status: "OPEN", durationMinutes: null, clockInAt: new Date("2026-10-02T00:00:00Z"), clockOutAt: null, employee },
  ]);

  const [{ firstClockInAt, lastClockOutAt, ...value }] = stats;
  assert.deepEqual(value, {
    employeeId: "1", name: "Ayu", username: "ayu", position: "Teknisi", sessionCount: 3,
    completedSessions: 2, incompleteSessions: 1, totalMinutes: 180, workDays: 1, averageMinutesPerDay: 180,
  });
  assert.equal(firstClockInAt.toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(lastClockOutAt?.toISOString(), "2026-10-01T04:00:00.000Z");
});
