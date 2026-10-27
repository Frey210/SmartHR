"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { businessDate } from "@/lib/date";
import { db } from "@/lib/db";
import { adjustmentLabels, calculatePayroll, emptyAdjustments, MAX_PAYROLL_AMOUNT, PayrollError, payrollAttendanceSnapshot, payrollPeriod, type PayrollAdjustments, type PayrollProfileSnapshot } from "@/lib/payroll";

export type PayrollState = { ok: boolean; message: string };
const fail = (error: unknown): PayrollState => ({ ok: false, message: error instanceof PayrollError ? error.message : "Perubahan belum tersimpan. Muat ulang lalu coba lagi." });
const number = (form: FormData, key: string, min = 0, max = MAX_PAYROLL_AMOUNT) => {
  const raw = String(form.get(key) ?? "").trim();
  const value = Number(raw);
  if (!raw || !Number.isSafeInteger(value) || value < min || value > max) throw new PayrollError("Isi semua nominal dan jumlah hari dengan bilangan bulat sesuai batas kolom.");
  return value;
};
const invalidate = (id?: string) => { revalidatePath("/payroll"); revalidatePath("/admin/payroll"); revalidatePath("/payslips"); if (id) revalidatePath(`/payslips/${id}`); };

export async function savePayrollSettingsAction(_: PayrollState, form: FormData): Promise<PayrollState> {
  const user = await requireUser("ADMIN");
  try {
    const data = { periodStartDay: number(form, "periodStartDay", 1, 31), payday: number(form, "payday", 1, 31), minutesPerDay: number(form, "minutesPerDay", 1, 1440), signerName: String(form.get("signerName") ?? "").trim(), signerPosition: String(form.get("signerPosition") ?? "").trim(), city: String(form.get("city") ?? "").trim() };
    if (!data.signerName || data.signerName.length > 100 || !data.signerPosition || data.signerPosition.length > 100 || !data.city || data.city.length > 80) throw new PayrollError("Isi nama penanggung jawab, jabatan, dan kota yang valid.");
    if (data.payday < data.periodStartDay - 1) throw new PayrollError("Tanggal gajian tidak boleh mendahului akhir periode perhitungan.");
    await db.$transaction([
      db.payrollSetting.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data }),
      db.auditLog.create({ data: { actorId: user.id, action: "PAYROLL_SETTINGS_UPDATED", entityType: "PayrollSetting", entityId: "1" } }),
    ]);
    invalidate(); return { ok: true, message: "Aturan payroll disimpan. Periode yang sudah dibuat tetap memakai aturan semula." };
  } catch (error) { return fail(error); }
}

export async function savePayrollProfileAction(_: PayrollState, form: FormData): Promise<PayrollState> {
  const user = await requireUser("ADMIN");
  try {
    const employeeId = String(form.get("employeeId") ?? "");
    const employee = await db.user.findFirst({ where: { id: employeeId, isActive: true, role: { in: ["ADMIN", "HR", "EMPLOYEE"] } }, select: { id: true } });
    if (!employee) throw new PayrollError("Akun aktif tidak ditemukan.");
    const data = { baseSalary: number(form, "baseSalary"), communicationAllowance: number(form, "communicationAllowance"), transportRate: number(form, "transportRate"), maxPaidDays: number(form, "maxPaidDays", 0, 366), nationalId: String(form.get("nationalId") ?? "").trim(), taxStatus: String(form.get("taxStatus") ?? "").trim() };
    if (data.nationalId && !/^\d{16}$/.test(data.nationalId)) throw new PayrollError("NIK harus 16 digit, atau kosongkan jika belum tersedia.");
    if (!data.taxStatus || data.taxStatus.length > 30) throw new PayrollError("Isi status/tanggungan maksimal 30 karakter.");
    await db.$transaction([
      db.payrollProfile.upsert({ where: { employeeId }, create: { employeeId, ...data }, update: data }),
      db.auditLog.create({ data: { actorId: user.id, action: "PAYROLL_PROFILE_UPDATED", entityType: "User", entityId: employeeId } }),
    ]);
    invalidate(); return { ok: true, message: "Profil gaji disimpan. Draft yang sudah dibuat tidak berubah otomatis." };
  } catch (error) { return fail(error); }
}

export async function generatePayslipsAction(_: PayrollState, form: FormData): Promise<PayrollState> {
  const user = await requireUser(["ADMIN", "HR"]);
  try {
    const key = String(form.get("period") ?? "");
    const count = await db.$transaction(async (tx) => {
      let period = await tx.payrollPeriod.findUnique({ where: { key } });
      if (!period) {
        const settings = await tx.payrollSetting.findUnique({ where: { id: 1 } });
        if (!settings?.signerName || !settings.signerPosition) throw new PayrollError("Admin perlu menyimpan aturan payroll dan penanggung jawab terlebih dahulu.");
        const company = await tx.appSetting.findUnique({ where: { id: 1 } });
        const dates = payrollPeriod(key, settings.periodStartDay, settings.payday);
        const overlapping = await tx.payrollPeriod.findFirst({ where: { startDate: { lt: dates.endDate }, endDate: { gt: dates.startDate } }, select: { key: true } });
        if (overlapping) throw new PayrollError(`Tanggal periode tumpang tindih dengan ${overlapping.key}. Periksa tanggal awal periode di pengaturan payroll.`);
        period = await tx.payrollPeriod.create({ data: { key, ...dates, timezone: company?.timezone ?? "Asia/Singapore", minutesPerDay: settings.minutesPerDay, signerName: settings.signerName, signerPosition: settings.signerPosition, city: settings.city, createdBy: user.id } });
      }
      const profiles = await tx.payrollProfile.findMany({ where: { employee: { isActive: true, role: { in: ["ADMIN", "HR", "EMPLOYEE"] } } }, include: { employee: { select: { id: true, name: true, username: true, position: true } } } });
      if (!profiles.length) throw new PayrollError("Belum ada profil gaji. Admin perlu melengkapi nominal dan batas hari pegawai.");
      let created = 0;
      for (const profile of profiles) {
        if (await tx.payslip.findUnique({ where: { periodId_employeeId: { periodId: period.id, employeeId: profile.employeeId } }, select: { id: true } })) continue;
        const snapshot: PayrollProfileSnapshot = { ...profile.employee, baseSalary: profile.baseSalary, communicationAllowance: profile.communicationAllowance, transportRate: profile.transportRate, maxPaidDays: profile.maxPaidDays, nationalId: profile.nationalId, taxStatus: profile.taxStatus };
        const sessions = await tx.attendanceSession.findMany({ where: { employeeId: profile.employeeId, businessDate: { gte: period.startDate, lt: period.endDate } } });
        await tx.payslip.create({ data: { periodId: period.id, employeeId: profile.employeeId, profileSnapshot: JSON.stringify(snapshot), attendanceSnapshot: payrollAttendanceSnapshot(sessions), adjustments: JSON.stringify(emptyAdjustments), ...calculatePayroll(sessions, period.minutesPerDay, snapshot, emptyAdjustments) } });
        created++;
      }
      await tx.auditLog.create({ data: { actorId: user.id, action: "PAYROLL_DRAFTS_GENERATED", entityType: "PayrollPeriod", entityId: period.id, details: JSON.stringify({ created }) } });
      return created;
    }, { timeout: 30_000, isolationLevel: "Serializable" });
    invalidate(); return { ok: true, message: `${count} draft dibuat. Slip yang sudah ada tidak ditimpa.` };
  } catch (error) { return fail(error); }
}

export async function updatePayslipAction(_: PayrollState, form: FormData): Promise<PayrollState> {
  const user = await requireUser(["ADMIN", "HR"]);
  try {
    const id = String(form.get("id") ?? "");
    const version = number(form, "version", 1);
    const operation = String(form.get("operation") ?? "save");
    if (!["save", "refresh", "publish"].includes(operation)) throw new PayrollError("Aksi payroll tidak valid.");
    await db.$transaction(async (tx) => {
      const slip = await tx.payslip.findUnique({ where: { id }, include: { period: true } });
      if (!slip || slip.status !== "DRAFT" || slip.version !== version) throw new PayrollError("Draft telah berubah atau sudah diterbitkan. Muat ulang halaman.");
      const sessions = await tx.attendanceSession.findMany({ where: { employeeId: slip.employeeId, businessDate: { gte: slip.period.startDate, lt: slip.period.endDate } } });
      const source = payrollAttendanceSnapshot(sessions);
      let profile: PayrollProfileSnapshot = JSON.parse(slip.profileSnapshot);
      let adjustments: PayrollAdjustments = JSON.parse(slip.adjustments);
      if (operation === "save") {
        adjustments = { ...emptyAdjustments, note: String(form.get("note") ?? "").trim() };
        if (adjustments.note.length > 5000) throw new PayrollError("Catatan maksimal 5000 karakter.");
        for (const key of Object.keys(adjustmentLabels) as (keyof typeof adjustmentLabels)[]) adjustments[key] = number(form, key);
      }
      if (operation === "refresh") {
        if (user.role === "ADMIN") {
          const latest = await tx.payrollProfile.findUnique({ where: { employeeId: slip.employeeId }, include: { employee: { select: { name: true, username: true, position: true } } } });
          if (latest) profile = { ...latest.employee, nationalId: latest.nationalId, taxStatus: latest.taxStatus, baseSalary: latest.baseSalary, communicationAllowance: latest.communicationAllowance, transportRate: latest.transportRate, maxPaidDays: latest.maxPaidDays };
        }
      } else if (source !== slip.attendanceSnapshot) throw new PayrollError("Absensi berubah setelah draft dihitung. Hitung ulang absensi sebelum menyimpan atau menerbitkan.");
      if (operation === "publish") {
        if (form.get("reviewed") !== "on") throw new PayrollError("Konfirmasi bahwa komponen gaji dan absensi sudah ditinjau.");
        if (businessDate(slip.period.timezone) < slip.period.endDate) throw new PayrollError("Periode belum selesai. Slip baru dapat diterbitkan setelah tanggal akhir perhitungan.");
      }
      const result = await tx.payslip.updateMany({ where: { id, status: "DRAFT", version }, data: {
        ...calculatePayroll(sessions, slip.period.minutesPerDay, profile, adjustments),
        attendanceSnapshot: source, profileSnapshot: JSON.stringify(profile), adjustments: JSON.stringify(adjustments), version: { increment: 1 },
        ...(operation === "publish" ? { status: "PUBLISHED", publishedBy: user.id, publishedAt: new Date() } : {}),
      } });
      if (!result.count) throw new PayrollError("Draft diubah reviewer lain. Muat ulang halaman.");
      await tx.auditLog.create({ data: { actorId: user.id, action: operation === "publish" ? "PAYSLIP_PUBLISHED" : operation === "refresh" ? "PAYSLIP_RECALCULATED" : "PAYSLIP_UPDATED", entityType: "Payslip", entityId: id } });
    }, { isolationLevel: "Serializable" });
    invalidate(id); return { ok: true, message: operation === "publish" ? "Slip disetujui dan diterbitkan ke akun pegawai." : operation === "refresh" ? "Absensi dihitung ulang. Periksa hasil sebelum menerbitkan." : "Komponen draft disimpan." };
  } catch (error) { return fail(error); }
}
