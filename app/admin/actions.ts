"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";

export type LocationState = { ok: boolean; message: string };
export type AdminFormState = { ok: boolean; message: string };

export async function addLocationAction(_: LocationState, formData: FormData): Promise<LocationState> {
  const admin = await requireUser("ADMIN");
  const name = String(formData.get("name") ?? "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  if (name.length < 2 || name.length > 80) return { ok: false, message: "Nama lokasi harus terdiri dari 2-80 karakter." };
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return { ok: false, message: "Latitude tidak valid." };
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return { ok: false, message: "Longitude tidak valid." };

  const location = await db.attendanceLocation.create({ data: { name, latitude, longitude, radiusM: 50 } });
  await writeAudit(admin.id, "LOCATION_CREATED", "AttendanceLocation", location.id, { name });
  revalidatePath("/admin");
  revalidatePath("/employee");
  return { ok: true, message: "Lokasi absensi berhasil ditambahkan." };
}

export async function reviewClockOutRequestAction(formData: FormData) {
  const admin = await requireUser("ADMIN");
  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const request = await db.clockOutRequest.findUnique({ where: { id: requestId }, include: { attendanceSession: true } });
  if (!request || request.status !== "PENDING" || !["APPROVED", "REJECTED"].includes(decision)) return;

  const reviewedAt = new Date();
  if (decision === "APPROVED" && request.attendanceSession.status === "OPEN") {
    const durationMinutes = Math.max(0, Math.floor((request.requestedClockOutAt.getTime() - request.attendanceSession.clockInAt.getTime()) / 60_000));
    await db.$transaction([
      db.clockOutRequest.update({ where: { id: request.id }, data: { status: decision, reviewedBy: admin.id, reviewedAt } }),
      db.attendanceSession.update({ where: { id: request.attendanceSessionId }, data: { status: "CLOSED", clockOutAt: request.requestedClockOutAt, durationMinutes, clockOutSource: "ADMIN_APPROVED" } }),
      db.auditLog.create({ data: { actorId: admin.id, action: "CLOCK_OUT_REQUEST_APPROVED", entityType: "ClockOutRequest", entityId: request.id } }),
    ]);
  } else {
    await db.$transaction([
      db.clockOutRequest.update({ where: { id: request.id }, data: { status: decision, reviewedBy: admin.id, reviewedAt } }),
      db.auditLog.create({ data: { actorId: admin.id, action: "CLOCK_OUT_REQUEST_REJECTED", entityType: "ClockOutRequest", entityId: request.id } }),
    ]);
  }
  revalidatePath("/admin");
  revalidatePath("/employee");
}

export async function createEmployeeAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireUser("ADMIN");
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const position = String(formData.get("position") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2 || name.length > 100) return { ok: false, message: "Nama harus terdiri dari 2-100 karakter." };
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) return { ok: false, message: "Username harus 3-40 karakter: huruf kecil, angka, titik, garis bawah, atau tanda hubung." };
  if (!position || position.length > 80) return { ok: false, message: "Posisi wajib diisi dan maksimal 80 karakter." };
  if (password.length < 8 || password.length > 128) return { ok: false, message: "Password awal harus terdiri dari 8-128 karakter." };
  try {
    const employee = await db.user.create({ data: { name, username, position, passwordHash: await hashPassword(password), role: "EMPLOYEE" } });
    await writeAudit(admin.id, "EMPLOYEE_CREATED", "User", employee.id, { username });
  } catch {
    return { ok: false, message: "Username sudah digunakan." };
  }
  revalidatePath("/admin");
  return { ok: true, message: "Akun karyawan berhasil dibuat." };
}

export async function resetEmployeePasswordAction(formData: FormData) {
  const admin = await requireUser("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8 || password.length > 128) return;
  const employee = await db.user.findFirst({ where: { id: userId, role: "EMPLOYEE" }, select: { id: true } });
  if (!employee) return;
  await db.$transaction([
    db.user.update({ where: { id: employee.id }, data: { passwordHash: await hashPassword(password) } }),
    db.authSession.deleteMany({ where: { userId: employee.id } }),
    db.auditLog.create({ data: { actorId: admin.id, action: "EMPLOYEE_PASSWORD_RESET", entityType: "User", entityId: employee.id } }),
  ]);
  revalidatePath("/admin");
}

export async function toggleEmployeeAction(formData: FormData) {
  const admin = await requireUser("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  const employee = await db.user.findFirst({ where: { id: userId, role: "EMPLOYEE" }, select: { id: true, isActive: true } });
  if (!employee) return;
  await db.$transaction([
    db.user.update({ where: { id: employee.id }, data: { isActive: !employee.isActive } }),
    ...(!employee.isActive ? [] : [db.authSession.deleteMany({ where: { userId: employee.id } })]),
    db.auditLog.create({ data: { actorId: admin.id, action: employee.isActive ? "EMPLOYEE_DEACTIVATED" : "EMPLOYEE_ACTIVATED", entityType: "User", entityId: employee.id } }),
  ]);
  revalidatePath("/admin");
}

export async function updateTimezoneAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireUser("ADMIN");
  const timezone = String(formData.get("timezone") ?? "").trim();
  try {
    new Intl.DateTimeFormat("id-ID", { timeZone: timezone }).format();
  } catch {
    return { ok: false, message: "Zona waktu IANA tidak valid." };
  }
  await db.appSetting.upsert({ where: { id: 1 }, update: { timezone, updatedBy: admin.id }, create: { id: 1, timezone, updatedBy: admin.id } });
  await writeAudit(admin.id, "TIMEZONE_UPDATED", "AppSetting", "1", { timezone });
  revalidatePath("/admin");
  revalidatePath("/employee");
  return { ok: true, message: "Zona waktu berhasil diperbarui." };
}

export async function toggleLocationAction(formData: FormData) {
  const admin = await requireUser("ADMIN");
  const locationId = String(formData.get("locationId") ?? "");
  const location = await db.attendanceLocation.findUnique({ where: { id: locationId }, select: { id: true, isActive: true } });
  if (!location) return;
  await db.attendanceLocation.update({ where: { id: location.id }, data: { isActive: !location.isActive } });
  await writeAudit(admin.id, location.isActive ? "LOCATION_DEACTIVATED" : "LOCATION_ACTIVATED", "AttendanceLocation", location.id);
  revalidatePath("/admin");
  revalidatePath("/employee");
}

export async function deleteEvidenceAction(formData: FormData) {
  const admin = await requireUser("ADMIN");
  const evidenceId = String(formData.get("evidenceId") ?? "");
  const evidence = await db.workEvidence.findFirst({ where: { id: evidenceId, deletedAt: null } });
  if (!evidence) return;
  const storageRoot = path.resolve(process.cwd(), "storage");
  const filePath = path.resolve(storageRoot, evidence.objectKey);
  if (filePath.startsWith(storageRoot + path.sep)) await unlink(filePath).catch(() => undefined);
  await db.$transaction([
    db.workEvidence.update({ where: { id: evidence.id }, data: { deletedAt: new Date(), deletedBy: admin.id } }),
    db.auditLog.create({ data: { actorId: admin.id, action: "EVIDENCE_DELETED", entityType: "WorkEvidence", entityId: evidence.id, details: JSON.stringify({ attendanceSessionId: evidence.attendanceSessionId }) } }),
  ]);
  revalidatePath("/admin");
  revalidatePath("/admin/records");
  revalidatePath(`/admin/sessions/${evidence.attendanceSessionId}`);
}
