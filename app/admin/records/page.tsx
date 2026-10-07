import Link from "next/link";
import { CalendarBlank, Clock, DownloadSimple, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { AppHeader } from "@/app/_components/app-header";
import { requireUser } from "@/lib/auth";
import { attendanceStatusLabel } from "@/lib/attendance";
import { businessDate, formatDateTime, formatMinutes } from "@/lib/date";
import { db } from "@/lib/db";
import { monthRange } from "@/lib/month";
import { employeeAttendanceStats } from "@/lib/report";

export default async function RecordsPage({ searchParams }: { searchParams: Promise<{ month?: string; employee?: string }> }) {
  const user = await requireUser("ADMIN");
  const settings = await db.appSetting.findUnique({ where: { id: 1 } });
  const timezone = settings?.timezone ?? "Asia/Singapore";
  const query = await searchParams;
  const range = monthRange(query.month, businessDate(timezone).slice(0, 7));
  const month = range.month;
  const employeeId = typeof query.employee === "string" ? query.employee : "";

  const [employees, sessions] = await Promise.all([
    db.user.findMany({ where: { role: { in: ["EMPLOYEE", "ARCHIVED_EMPLOYEE"] } }, orderBy: { name: "asc" } }),
    db.attendanceSession.findMany({
      where: { businessDate: { gte: range.start, lte: range.end }, ...(employeeId ? { employeeId } : {}) },
      include: { employee: true, location: true, evidences: { where: { deletedAt: null }, select: { id: true } } },
      orderBy: { clockInAt: "desc" },
    }),
  ]);
  const totalMinutes = sessions.reduce((sum, session) => sum + (session.durationMinutes ?? 0), 0);
  const uniqueEmployees = new Set(sessions.map((session) => session.employeeId)).size;
  const employeeStats = employeeAttendanceStats(sessions);

  return <div className="min-h-[100dvh]">
    <AppHeader name={user.name} position={user.position} role="ADMIN" />
    <main className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
        <p className="text-sm font-bold text-[#0868D7]">Laporan operasional</p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-[#2B3C5A]">Rekap absensi</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/records.xlsx?month=${encodeURIComponent(month)}${employeeId ? `&employee=${encodeURIComponent(employeeId)}` : ""}`} className="button-primary"><DownloadSimple size={20} aria-hidden="true" />Unduh laporan Excel</a>
          <a href={`/api/admin/records.csv?month=${encodeURIComponent(month)}${employeeId ? `&employee=${encodeURIComponent(employeeId)}` : ""}`} className="button-secondary">CSV mentah</a>
        </div>
      </section>

      <form method="get" className="surface grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Bulan<input type="month" name="month" defaultValue={month} className="field font-normal" /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Karyawan<select name="employee" defaultValue={employeeId} className="field font-normal"><option value="">Semua karyawan</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}{employee.role === "ARCHIVED_EMPLOYEE" ? " (akun dihapus)" : ""}</option>)}</select></label>
        <button className="button-primary">Tampilkan</button>
      </form>

      <section className="grid gap-4 min-[420px]:grid-cols-3" aria-label="Ringkasan rekap">
        <article className="surface p-5"><CalendarBlank size={22} className="text-[#1A82FF]" aria-hidden="true" /><p className="mt-4 text-sm text-slate-500">Jumlah sesi</p><p className="number mt-1 text-2xl font-bold text-[#2B3C5A]">{sessions.length}</p></article>
        <article className="surface p-5"><UsersThree size={22} className="text-[#1A82FF]" aria-hidden="true" /><p className="mt-4 text-sm text-slate-500">Karyawan</p><p className="number mt-1 text-2xl font-bold text-[#2B3C5A]">{uniqueEmployees}</p></article>
        <article className="surface p-5"><Clock size={22} className="text-[#1A82FF]" aria-hidden="true" /><p className="mt-4 text-sm text-slate-500">Total waktu</p><p className="number mt-1 text-2xl font-bold text-[#2B3C5A]">{formatMinutes(totalMinutes)}</p></article>
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Ringkasan per karyawan</h2>
          <p className="mt-1 text-sm text-slate-500">Jam tercatat aktual untuk pemeriksaan payroll. Aplikasi tidak menerapkan target jam harian.</p>
        </div>
        {employeeStats.length ? <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="px-6 py-3">Karyawan</th><th className="px-4 py-3">Hari tercatat</th><th className="px-4 py-3">Sesi</th><th className="px-4 py-3">Selesai</th><th className="px-4 py-3">Perlu tindak lanjut</th><th className="px-4 py-3">Total jam</th><th className="px-6 py-3">Rata-rata / hari</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{employeeStats.map((stat) => <tr key={stat.employeeId} className="hover:bg-slate-50/70">
            <td className="px-6 py-4"><p className="font-bold text-slate-900">{stat.name}</p><p className="mt-1 text-xs text-slate-500">@{stat.username} · {stat.position}</p></td>
            <td className="number px-4 py-4">{stat.workDays}</td><td className="number px-4 py-4">{stat.sessionCount}</td><td className="number px-4 py-4">{stat.completedSessions}</td>
            <td className="number px-4 py-4">{stat.incompleteSessions ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{stat.incompleteSessions}</span> : "0"}</td>
            <td className="number px-4 py-4 font-bold text-[#2B3C5A]">{formatMinutes(stat.totalMinutes)}</td><td className="number px-6 py-4">{formatMinutes(stat.averageMinutesPerDay)}</td>
          </tr>)}</tbody>
        </table></div> : <p className="px-6 py-10 text-center text-sm text-slate-500">Belum ada data karyawan untuk periode ini.</p>}
      </section>

      <section className="surface overflow-hidden">
        {sessions.length ? <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-6 py-3">Karyawan</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Lokasi</th><th className="px-4 py-3">Durasi / status</th><th className="px-4 py-3">Bukti</th><th className="px-6 py-3">Detail</th></tr></thead><tbody className="divide-y divide-slate-100">{sessions.map((session) => <tr key={session.id}><td className="px-6 py-4 font-bold text-slate-900">{session.employee.name}</td><td className="number px-4 py-4">{formatDateTime(session.clockInAt, timezone)}</td><td className="px-4 py-4">{session.location?.name ?? "Tanpa lokasi"}</td><td className="number px-4 py-4">{attendanceStatusLabel(session.status, session.durationMinutes)}</td><td className="number px-4 py-4">{session.evidences.length}</td><td className="px-6 py-4"><Link href={`/admin/sessions/${session.id}`} className="font-bold text-[#0868D7] hover:underline">Buka</Link></td></tr>)}</tbody></table></div> : <p className="px-6 py-14 text-center text-sm text-slate-500">Tidak ada sesi untuk filter ini.</p>}
      </section>
    </main>
  </div>;
}
