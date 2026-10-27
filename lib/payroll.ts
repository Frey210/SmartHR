export class PayrollError extends Error {}

export const MAX_PAYROLL_AMOUNT = 2_147_483_647;

export const adjustmentLabels = {
  kpi: "Tunjangan KPI", overtime: "Tunjangan lembur", position: "Tunjangan jabatan", holiday: "Tunjangan hari raya",
  incomeTax: "Potongan PPh 21", otherDeduction: "Potongan tambahan",
  leaveDays: "Izin (hari)", sickDays: "Sakit (hari)", absentDays: "Alpha (hari)", unexplainedDays: "Tanpa keterangan (hari)",
} as const;
export type PayrollAdjustments = Record<keyof typeof adjustmentLabels, number> & { note: string };
export const emptyAdjustments: PayrollAdjustments = { kpi: 0, overtime: 0, position: 0, holiday: 0, incomeTax: 0, otherDeduction: 0, leaveDays: 0, sickDays: 0, absentDays: 0, unexplainedDays: 0, note: "" };
export type PayrollProfileSnapshot = { name: string; username: string; position: string; nationalId: string; taxStatus: string; baseSalary: number; communicationAllowance: number; transportRate: number; maxPaidDays: number };
export type PayrollAttendance = { id: string; businessDate: string; status: string; durationMinutes: number | null; updatedAt: Date; clockInAt: Date; clockOutAt: Date | null };

export function payrollPeriod(key: string, startDay: number, payday: number) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) throw new PayrollError("Pilih bulan pembayaran yang valid.");
  const [year, month] = key.split("-").map(Number);
  if (year < 2000 || year > 9998 || !Number.isInteger(startDay) || startDay < 1 || startDay > 31 || !Number.isInteger(payday) || payday < 1 || payday > 31) throw new PayrollError("Tanggal payroll tidak valid.");
  const date = (offset: number, day: number) => new Date(Date.UTC(year, month - 1 + offset, Math.min(day, new Date(Date.UTC(year, month + offset, 0)).getUTCDate()))).toISOString().slice(0, 10);
  const result = { startDate: date(-1, startDay), endDate: date(0, startDay), payDate: date(0, payday) };
  const lastDate = new Date(Date.parse(result.endDate) - 86_400_000).toISOString().slice(0, 10);
  if (result.payDate < lastDate) throw new PayrollError("Tanggal gajian tidak boleh mendahului akhir periode perhitungan.");
  return result;
}

export function payrollAttendanceSnapshot(sessions: PayrollAttendance[]) {
  return JSON.stringify([...sessions].sort((a, b) => a.id.localeCompare(b.id)).map((s) => ({ id: s.id, date: s.businessDate, status: s.status, minutes: s.durationMinutes, clockInAt: s.clockInAt.toISOString(), clockOutAt: s.clockOutAt?.toISOString() ?? null, updatedAt: s.updatedAt.toISOString() })));
}

export function calculatePayroll(sessions: PayrollAttendance[], minutesPerDay: number, profile: PayrollProfileSnapshot, adjustments: PayrollAdjustments) {
  for (const value of [minutesPerDay, profile.baseSalary, profile.communicationAllowance, profile.transportRate, profile.maxPaidDays, ...Object.keys(adjustmentLabels).map((key) => adjustments[key as keyof typeof adjustmentLabels])]) {
    if (!Number.isSafeInteger(value) || value < 0 || value > MAX_PAYROLL_AMOUNT) throw new PayrollError("Nominal dan jumlah hari harus bilangan bulat yang valid.");
  }
  if (minutesPerDay < 1) throw new PayrollError("Menit per hari harus lebih dari nol.");
  const valid = sessions.filter((s) => s.status === "CLOSED" && s.clockOutAt && s.clockOutAt > s.clockInAt && s.durationMinutes !== null && Number.isSafeInteger(s.durationMinutes) && s.durationMinutes >= 0);
  const totalMinutes = valid.reduce((total, s) => total + s.durationMinutes!, 0);
  const earnedDays = Math.floor(totalMinutes / minutesPerDay);
  const paidDays = Math.min(earnedDays, profile.maxPaidDays);
  const grossPay = profile.baseSalary + profile.communicationAllowance + paidDays * profile.transportRate + adjustments.kpi + adjustments.overtime + adjustments.position + adjustments.holiday;
  const netPay = grossPay - adjustments.incomeTax - adjustments.otherDeduction;
  if ([totalMinutes, earnedDays, grossPay, netPay].some((v) => !Number.isSafeInteger(v) || v < 0 || v > MAX_PAYROLL_AMOUNT)) throw new PayrollError("Total di luar batas nominal atau potongan melebihi gaji bruto.");
  return { totalMinutes, earnedDays, paidDays, remainderMinutes: totalMinutes % minutesPerDay, excludedCount: sessions.length - valid.length, grossPay, netPay };
}

export const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
export const payrollDate = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
export const lastPayrollDate = (exclusiveEnd: string) => new Date(Date.parse(exclusiveEnd) - 86_400_000).toISOString().slice(0, 10);
