import { getCurrentUser } from "@/lib/auth";
import { businessDate } from "@/lib/date";
import { db } from "@/lib/db";
import { monthRange } from "@/lib/month";

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Unauthorized", { status: 401 });
  const url = new URL(request.url);
  const settings = await db.appSetting.findUnique({ where: { id: 1 } });
  const timezone = settings?.timezone ?? "Asia/Singapore";
  const range = monthRange(url.searchParams.get("month") ?? undefined, businessDate(timezone).slice(0, 7));
  const employeeId = url.searchParams.get("employee") ?? "";
  const sessions = await db.attendanceSession.findMany({
    where: { businessDate: { gte: range.start, lte: range.end }, ...(employeeId ? { employeeId } : {}) },
    include: { employee: true, location: true, evidences: { where: { deletedAt: null }, select: { id: true } } },
    orderBy: [{ businessDate: "asc" }, { clockInAt: "asc" }],
  });
  const rows = [
    ["Tanggal", "Karyawan", "Username", "Posisi", "Lokasi", "Clock In UTC", "Clock Out UTC", "Durasi Menit", "Status", "Sumber Clock Out", "Jumlah Bukti"],
    ...sessions.map((session) => [session.businessDate, session.employee.name, session.employee.username, session.employee.position, session.location?.name ?? "Lokasi dihapus", session.clockInAt.toISOString(), session.clockOutAt?.toISOString() ?? "", session.durationMinutes ?? "", session.status, session.clockOutSource ?? "", session.evidences.length]),
  ];
  const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rekap-absensi-${range.month}.csv"`, "Cache-Control": "private, no-store" } });
}
