import writeXlsxFile, { type CellObject, type SheetData } from "write-excel-file/node";
import { getCurrentUser } from "@/lib/auth";
import { attendanceStatusLabel } from "@/lib/attendance";
import { businessDate, formatDateTime } from "@/lib/date";
import { db } from "@/lib/db";
import { monthRange } from "@/lib/month";
import { employeeAttendanceStats } from "@/lib/report";

const border = { borderColor: "#DCE4EC", borderStyle: "thin" as const };
const header = (value: string): CellObject => ({ value, fontWeight: "bold", textColor: "#FFFFFF", backgroundColor: "#1A82FF", alignVertical: "center", wrap: true, height: 34, ...border });
const cell = (value: string | number, index: number, extra: Partial<CellObject> = {}): CellObject => ({ value, backgroundColor: index % 2 ? "#F6F9FC" : "#FFFFFF", alignVertical: "center", height: 26, ...border, ...extra });

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
  const stats = employeeAttendanceStats(sessions);
  const generatedAt = formatDateTime(new Date(), timezone);

  const summary: SheetData = [
    [{ value: "REKAP ABSENSI KARYAWAN", columnSpan: 11, fontSize: 18, fontWeight: "bold", textColor: "#FFFFFF", backgroundColor: "#2B3C5A", height: 36, alignVertical: "center" }, ...Array(10).fill(null)],
    [{ value: `Periode ${range.start} s.d. ${range.end} · Zona waktu ${timezone}`, columnSpan: 11, textColor: "#5B6B82", height: 24 }, ...Array(10).fill(null)],
    [{ value: `Dibuat ${generatedAt}`, columnSpan: 11, textColor: "#5B6B82", height: 24 }, ...Array(10).fill(null)],
    [],
    ["Nama", "Username", "Posisi", "Hari tercatat", "Jumlah sesi", "Sesi selesai", "Perlu tindak lanjut", "Total menit", "Total jam", "Rata-rata menit/hari", "Rata-rata jam/hari"].map(header),
    ...stats.map((stat, index) => [
      cell(stat.name, index), cell(stat.username, index), cell(stat.position, index), cell(stat.workDays, index, { type: Number }),
      cell(stat.sessionCount, index, { type: Number }), cell(stat.completedSessions, index, { type: Number }), cell(stat.incompleteSessions, index, { type: Number }),
      cell(stat.totalMinutes, index, { type: Number, format: "#,##0" }), cell(stat.totalMinutes / 60, index, { type: Number, format: "0.00" }),
      cell(stat.averageMinutesPerDay, index, { type: Number, format: "#,##0" }), cell(stat.averageMinutesPerDay / 60, index, { type: Number, format: "0.00" }),
    ]),
  ];

  const detail: SheetData = [
    [{ value: "DETAIL SESI ABSENSI", columnSpan: 12, fontSize: 18, fontWeight: "bold", textColor: "#FFFFFF", backgroundColor: "#2B3C5A", height: 36, alignVertical: "center" }, ...Array(11).fill(null)],
    [{ value: `Periode ${range.start} s.d. ${range.end} · Zona waktu ${timezone}`, columnSpan: 12, textColor: "#5B6B82", height: 24 }, ...Array(11).fill(null)],
    [],
    ["Tanggal", "Karyawan", "Username", "Posisi", "Lokasi", "Clock in", "Clock out", "Durasi menit", "Durasi jam", "Status", "Sumber clock out", "Jumlah bukti"].map(header),
    ...sessions.map((session, index) => [
      cell(session.businessDate, index), cell(session.employee.name, index), cell(session.employee.username, index), cell(session.employee.position, index),
      cell(session.location?.name ?? "Lokasi dihapus", index), cell(formatDateTime(session.clockInAt, timezone), index), cell(session.clockOutAt ? formatDateTime(session.clockOutAt, timezone) : "Belum clock out", index),
      cell(session.durationMinutes ?? 0, index, { type: Number, format: "#,##0" }), cell((session.durationMinutes ?? 0) / 60, index, { type: Number, format: "0.00" }),
      cell(session.status === "CLOSED" ? "Selesai" : attendanceStatusLabel(session.status, session.durationMinutes), index), cell(session.clockOutSource ?? "-", index), cell(session.evidences.length, index, { type: Number }),
    ]),
  ];

  const workbook = writeXlsxFile([
    { data: summary, sheet: "Ringkasan Payroll", showGridLines: false, stickyRowsCount: 5, columns: [24, 16, 20, 12, 13, 13, 19, 14, 12, 22, 20].map((width) => ({ width })) },
    { data: detail, sheet: "Detail Absensi", orientation: "landscape", showGridLines: false, stickyRowsCount: 4, columns: [13, 24, 16, 20, 22, 23, 23, 15, 13, 18, 20, 13].map((width) => ({ width })) },
  ], { fontFamily: "Arial", fontSize: 10 });
  const buffer = await workbook.toBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rekap-absensi-${range.month}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
