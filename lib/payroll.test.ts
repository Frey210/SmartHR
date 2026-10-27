import assert from "node:assert/strict";
import test from "node:test";
import { calculatePayroll, emptyAdjustments, payrollAttendanceSnapshot, payrollPeriod, type PayrollAttendance, type PayrollProfileSnapshot } from "./payroll.ts";

const profile: PayrollProfileSnapshot = { name: "Pegawai Uji", username: "uji", position: "Teknisi", nationalId: "", taxStatus: "TK/0", baseSalary: 1_000_000, communicationAllowance: 100_000, transportRate: 25_000, maxPaidDays: 2 };
const session = (id: string, minutes: number, status = "CLOSED"): PayrollAttendance => ({ id, businessDate: "2026-10-01", durationMinutes: minutes, status, updatedAt: new Date("2026-10-01T10:00:00Z"), clockInAt: new Date("2026-10-01T00:00:00Z"), clockOutAt: status === "CLOSED" ? new Date("2026-10-01T10:00:00Z") : null });

test("default payroll covers 25th to 24th, including year and short-month boundaries", () => {
  assert.deepEqual(payrollPeriod("2026-10", 25, 25), { startDate: "2026-09-25", endDate: "2026-10-25", payDate: "2026-10-25" });
  assert.equal(payrollPeriod("2026-01", 25, 25).startDate, "2025-12-25");
  assert.deepEqual(payrollPeriod("2028-03", 31, 31), { startDate: "2028-02-29", endDate: "2028-03-31", payDate: "2028-03-31" });
  assert.throws(() => payrollPeriod("2026-13", 25, 25));
  assert.throws(() => payrollPeriod("2026-10", 25, 10));
});

test("pool all valid minutes, floor full days, cap paid days, retain leftover minutes", () => {
  const result = calculatePayroll([session("1", 480), session("2", 120), session("3", 150), session("4", 900, "PENDING")], 300, profile, { ...emptyAdjustments, kpi: 50_000, incomeTax: 10_000, otherDeduction: 15_000 });
  assert.deepEqual(result, { totalMinutes: 750, earnedDays: 2, paidDays: 2, remainderMinutes: 150, excludedCount: 1, grossPay: 1_200_000, netPay: 1_175_000 });
  assert.equal(calculatePayroll([session("1", 1500)], 300, profile, emptyAdjustments).paidDays, 2);
  assert.equal(calculatePayroll([session("1", 420)], 300, profile, emptyAdjustments).earnedDays, 1);
  assert.equal(calculatePayroll([], 300, profile, emptyAdjustments).grossPay, 1_100_000);
});

test("reject unsafe money, fractional inputs and deductions above gross", () => {
  assert.throws(() => calculatePayroll([], 0, profile, emptyAdjustments));
  assert.throws(() => calculatePayroll([], 300, { ...profile, transportRate: -1 }, emptyAdjustments));
  assert.throws(() => calculatePayroll([], 300, profile, { ...emptyAdjustments, kpi: 0.5 }));
  assert.throws(() => calculatePayroll([], 300, profile, { ...emptyAdjustments, incomeTax: 2_000_000 }));
  assert.throws(() => calculatePayroll([], 300, { ...profile, baseSalary: 2_147_483_647 }, emptyAdjustments));
});

test("source snapshots ignore query order but detect attendance corrections", () => {
  const a = session("a", 300), b = session("b", 120);
  assert.equal(payrollAttendanceSnapshot([a, b]), payrollAttendanceSnapshot([b, a]));
  assert.notEqual(payrollAttendanceSnapshot([a]), payrollAttendanceSnapshot([{ ...a, durationMinutes: 301 }]));
});
