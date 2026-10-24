import { businessDate, formatMinutes } from "./date.ts";

export function attendanceStatusLabel(status: string, durationMinutes: number | null) {
  if (status === "OPEN") return "Berjalan";
  if (status === "PENDING") return "Menunggu verifikasi";
  if (status === "INCOMPLETE") return "Perlu koreksi";
  if (status === "REJECTED") return "Ditolak";
  return formatMinutes(durationMinutes ?? 0);
}

export function isAttendanceDayExpired(startedAtMs: number, nowMs: number, timezone: string) {
  return businessDate(timezone, new Date(startedAtMs)) !== businessDate(timezone, new Date(nowMs));
}

export function formatElapsedDuration(startedAtMs: number, nowMs: number, baseMinutes = 0, timezone?: string) {
  if (timezone && isAttendanceDayExpired(startedAtMs, nowMs, timezone)) return "00:00:00";
  const totalSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1_000)) + Math.max(0, baseMinutes) * 60;
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}
