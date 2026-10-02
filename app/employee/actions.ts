"use server";

import { revalidatePath } from "next/cache";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { businessDate } from "@/lib/date";
import { db } from "@/lib/db";
import { nearestAllowedLocation } from "@/lib/geo";
import { writeAudit } from "@/lib/audit";
import { matchesImageMime } from "@/lib/image";
import { evidenceDescriptions } from "@/lib/evidence";

type ClockInInput = { latitude: number; longitude: number; accuracyM: number };
export type AttendanceActionResult = { ok: boolean; message: string };

const allowedImages = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type PreparedEvidence = { file: File; bytes: Buffer; extension: string; description: string };

async function prepareEvidence(formData: FormData): Promise<{ files: PreparedEvidence[]; error?: string }> {
  const files = formData.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
  if (!files.length) return { files: [], error: "Tambahkan minimal satu foto dokumentasi." };
  const descriptions = evidenceDescriptions(files.length, formData.getAll("evidenceDescription"));
  if (!descriptions) return { files: [], error: "Setiap foto wajib memiliki satu deskripsi pekerjaan." };
  if (files.some((file) => !allowedImages.has(file.type) || file.size > 3_000_000)) {
    return { files: [], error: "Foto harus berformat JPG, PNG, atau WebP dan maksimal 3 MB setelah kompresi." };
  }
  const prepared = await Promise.all(files.map(async (file, index) => ({ file, bytes: Buffer.from(await file.arrayBuffer()), extension: allowedImages.get(file.type)!, description: descriptions[index] })));
  if (prepared.some(({ file, bytes }) => !matchesImageMime(bytes, file.type))) return { files: [], error: "Isi file tidak cocok dengan format gambar yang dipilih." };
  return { files: prepared };
}

async function storeEvidence(sessionId: string, files: PreparedEvidence[]) {
  const directory = path.join(process.cwd(), "storage", "evidence", sessionId);
  await mkdir(directory, { recursive: true });
  const saved: { objectKey: string; originalFilename: string; mimeType: string; sizeBytes: number; description: string }[] = [];
  for (const { file, bytes, extension, description } of files) {
    const objectKey = path.join("evidence", sessionId, `${randomUUID()}.${extension}`);
    await writeFile(path.join(process.cwd(), "storage", objectKey), bytes);
    saved.push({ objectKey, originalFilename: file.name, mimeType: file.type, sizeBytes: file.size, description });
  }
  return saved;
}

async function removeStoredEvidence(files: { objectKey: string }[]) {
  await Promise.all(files.map((file) => unlink(path.join(process.cwd(), "storage", file.objectKey)).catch(() => undefined)));
}

export async function clockInAction(input: ClockInInput): Promise<AttendanceActionResult> {
  const user = await requireUser("EMPLOYEE");
  const { latitude, longitude, accuracyM } = input;

  if (![latitude, longitude, accuracyM].every(Number.isFinite)) {
    return { ok: false, message: "Data lokasi tidak valid. Silakan coba lagi." };
  }
  if (accuracyM > 50) {
    return { ok: false, message: `Akurasi lokasi masih ${Math.round(accuracyM)} meter. Tunggu sinyal GPS membaik lalu coba lagi.` };
  }

  const [settings, locations, openSession] = await Promise.all([
    db.appSetting.findUnique({ where: { id: 1 } }),
    db.attendanceLocation.findMany({ where: { isActive: true } }),
    db.attendanceSession.findFirst({ where: { employeeId: user.id, status: "OPEN" } }),
  ]);

  const today = businessDate(settings?.timezone ?? "Asia/Singapore");
  if (openSession?.businessDate === today) return { ok: false, message: "Anda masih memiliki sesi kerja aktif hari ini." };
  if (!locations.length) return { ok: false, message: "Belum ada lokasi absensi aktif. Hubungi admin." };

  const nearest = nearestAllowedLocation(
    { latitude, longitude },
    locations.map((location) => ({
      id: location.id,
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      radiusM: location.radiusM,
    })),
  );

  if (!nearest) return { ok: false, message: "Anda berada di luar radius 50 meter dari lokasi absensi aktif." };

  try {
    const data = {
        employeeId: user.id,
        locationId: nearest.location.id,
        businessDate: today,
        clockInAt: new Date(),
        clockInLatitude: latitude,
        clockInLongitude: longitude,
        clockInAccuracyM: accuracyM,
        clockInDistanceM: nearest.distanceM,
      };
    const session = openSession
      ? (await db.$transaction([
          db.attendanceSession.update({ where: { id: openSession.id }, data: { status: "INCOMPLETE" } }),
          db.attendanceSession.create({ data }),
        ]))[1]
      : await db.attendanceSession.create({ data });
    await writeAudit(user.id, "ATTENDANCE_CLOCK_IN", "AttendanceSession", session.id, { locationId: nearest.location.id });
  } catch {
    return { ok: false, message: "Sesi aktif sudah tercatat. Muat ulang halaman untuk melihat status terbaru." };
  }

  revalidatePath("/employee");
  revalidatePath("/admin");
  return { ok: true, message: `Clock in berhasil di ${nearest.location.name}.` };
}

export async function clockOutAction(formData: FormData): Promise<AttendanceActionResult> {
  const user = await requireUser("EMPLOYEE");
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const accuracyM = Number(formData.get("accuracyM"));
  const evidence = await prepareEvidence(formData);

  if (evidence.error) return { ok: false, message: evidence.error };
  if (![latitude, longitude, accuracyM].every(Number.isFinite) || accuracyM > 50) {
    return { ok: false, message: "Lokasi clock out belum akurat. Tunggu GPS membaik lalu coba lagi." };
  }
  const [session, locations] = await Promise.all([
    db.attendanceSession.findFirst({ where: { employeeId: user.id, status: "OPEN" } }),
    db.attendanceLocation.findMany({ where: { isActive: true } }),
  ]);
  if (!session) return { ok: false, message: "Tidak ada sesi aktif untuk diakhiri." };

  const nearest = nearestAllowedLocation(
    { latitude, longitude },
    locations.map(({ id, name, latitude: lat, longitude: lng, radiusM }) => ({ id, name, latitude: lat, longitude: lng, radiusM })),
  );
  if (!nearest) return { ok: false, message: "Anda berada di luar radius 50 meter dari lokasi absensi aktif." };

  const saved: { objectKey: string; originalFilename: string; mimeType: string; sizeBytes: number; description: string }[] = [];
  try {
    saved.push(...await storeEvidence(session.id, evidence.files));

    const clockOutAt = new Date();
    const durationMinutes = Math.max(0, Math.floor((clockOutAt.getTime() - session.clockInAt.getTime()) / 60_000));
    await db.$transaction([
      db.attendanceSession.update({
        where: { id: session.id },
        data: {
          status: "CLOSED",
          clockOutAt,
          durationMinutes,
          clockOutLatitude: latitude,
          clockOutLongitude: longitude,
          clockOutAccuracyM: accuracyM,
          clockOutDistanceM: nearest.distanceM,
          clockOutSource: "EMPLOYEE",
        },
      }),
      db.workEvidence.createMany({
        data: saved.map((file) => ({ ...file, attendanceSessionId: session.id })),
      }),
      db.auditLog.create({ data: { actorId: user.id, action: "ATTENDANCE_CLOCK_OUT", entityType: "AttendanceSession", entityId: session.id, details: JSON.stringify({ evidenceCount: saved.length }) } }),
    ]);
  } catch {
    await removeStoredEvidence(saved);
    return { ok: false, message: "Clock out belum tersimpan. Silakan coba lagi." };
  }

  revalidatePath("/employee");
  revalidatePath("/admin");
  return { ok: true, message: "Clock out dan dokumentasi berhasil disimpan." };
}

export async function requestAttendanceCorrectionAction(formData: FormData): Promise<AttendanceActionResult> {
  const user = await requireUser("EMPLOYEE");
  const requestType = String(formData.get("requestType") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const requestedClockInAt = new Date(String(formData.get("requestedClockInAt") ?? ""));
  const requestedClockOutAt = new Date(String(formData.get("requestedClockOutAt") ?? ""));
  if (!["CLOCK_OUT", "MISSING_SESSION"].includes(requestType)) return { ok: false, message: "Jenis koreksi tidak valid." };
  if (!reason) return { ok: false, message: "Alasan koreksi wajib diisi." };
  if (Number.isNaN(requestedClockOutAt.getTime())) return { ok: false, message: "Waktu clock out tidak valid." };
  if (requestType === "MISSING_SESSION" && Number.isNaN(requestedClockInAt.getTime())) return { ok: false, message: "Waktu clock in tidak valid." };
  const evidence = await prepareEvidence(formData);
  if (evidence.error) return { ok: false, message: evidence.error };
  if (requestedClockOutAt > new Date()) return { ok: false, message: "Waktu koreksi tidak boleh melebihi waktu sekarang." };

  const sessionId = requestType === "CLOCK_OUT" ? String(formData.get("attendanceSessionId") ?? "") : randomUUID();
  const session = requestType === "CLOCK_OUT" ? await db.attendanceSession.findFirst({
    where: { id: sessionId, employeeId: user.id, status: { in: ["OPEN", "INCOMPLETE"] } },
    include: { correctionRequests: { where: { status: "PENDING" } } },
  }) : null;
  if (requestType === "CLOCK_OUT" && !session) return { ok: false, message: "Sesi yang akan dikoreksi tidak ditemukan." };
  if (session?.correctionRequests.length) return { ok: false, message: "Permintaan sebelumnya masih menunggu keputusan admin." };
  const effectiveClockIn = session?.clockInAt ?? requestedClockInAt;
  if (requestedClockOutAt <= effectiveClockIn) return { ok: false, message: "Waktu clock out harus setelah clock in." };

  const saved: { objectKey: string; originalFilename: string; mimeType: string; sizeBytes: number; description: string }[] = [];
  const requestId = randomUUID();
  try {
    saved.push(...await storeEvidence(sessionId, evidence.files));
    const settings = requestType === "MISSING_SESSION" ? await db.appSetting.findUnique({ where: { id: 1 } }) : null;
    await db.$transaction([
      ...(requestType === "MISSING_SESSION" ? [db.attendanceSession.create({ data: {
        id: sessionId,
        employeeId: user.id,
        businessDate: businessDate(settings?.timezone ?? "Asia/Singapore", requestedClockInAt),
        status: "PENDING",
        clockInAt: requestedClockInAt,
        clockOutAt: requestedClockOutAt,
        clockInLatitude: 0,
        clockInLongitude: 0,
        clockInDistanceM: 0,
        clockOutSource: "ADMIN_PENDING",
      } })] : [db.attendanceSession.update({ where: { id: sessionId }, data: { status: "PENDING" } })]),
      db.clockOutRequest.create({ data: { id: requestId, attendanceSessionId: sessionId, requestType, requestedClockInAt: requestType === "MISSING_SESSION" ? requestedClockInAt : null, requestedClockOutAt, reason } }),
      db.workEvidence.createMany({ data: saved.map((file) => ({ ...file, attendanceSessionId: sessionId })) }),
      db.auditLog.create({ data: { actorId: user.id, action: "ATTENDANCE_CORRECTION_REQUESTED", entityType: "ClockOutRequest", entityId: requestId, details: JSON.stringify({ attendanceSessionId: sessionId, requestType, evidenceCount: saved.length }) } }),
    ]);
  } catch {
    await removeStoredEvidence(saved);
    return { ok: false, message: "Permintaan belum tersimpan. Silakan coba lagi." };
  }
  revalidatePath("/employee");
  revalidatePath("/admin");
  return { ok: true, message: "Koreksi absensi dikirim dan menunggu persetujuan admin." };
}
