import { formatMinutes } from "./date.ts";

export function attendanceStatusLabel(status: string, durationMinutes: number | null) {
  if (status === "OPEN") return "Berjalan";
  if (status === "PENDING") return "Menunggu admin";
  if (status === "INCOMPLETE") return "Perlu koreksi";
  if (status === "REJECTED") return "Ditolak";
  return formatMinutes(durationMinutes ?? 0);
}
