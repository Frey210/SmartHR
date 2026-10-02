import Link from "next/link";
import { CalendarBlank, Clock, DownloadSimple, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { AppHeader } from "@/app/_components/app-header";
import { requireUser } from "@/lib/auth";
import { attendanceStatusLabel } from "@/lib/attendance";
import { businessDate, formatDateTime, formatMinutes } from "@/lib/date";
import { db } from "@/lib/db";
import { monthRange } from "@/lib/month";

export default async function RecordsPage({ searchParams }: { searchParams: Promise<{ month?: string; employee?: string }> }) {
  const user = await requireUser("ADMIN");
  const settings = await db.appSetting.findUnique({ where: { id: 1 } });
  const timezone = settings?.timezone ?? "Asia/Singapore";
  const query = await searchParams;
  const range = monthRange(query.month, businessDate(timezone).slice(0, 7));
  const month = range.month;
  const employeeId = typeof query.employee === "string" ? query.employee : "";

  const [employees, sessions] = await Promise.all([
    db.user.findMany({ where: { role: "EMPLOYEE" }, orderBy: { name: "asc" } }),
    db.attendanceSession.findMany({
      where: { businessDate: { gte: range.start, lte: range.end }, ...(employeeId ? { employeeId } : {}) },
      include: { employee: true, location: true, evidences: { where: { deletedAt: null }, select: { id: true } } },
      orderBy: { clockInAt: "desc" },
    }),
  ]);
  const totalMinutes = sessions.reduce((sum, session) => sum + (session.durationMinutes ?? 0), 0);
  const uniqueEmployees = new Set(sessions.map((session) => session.employeeId)).size;

  return <div className="min-h-[100dvh]">
    <AppHeader name={user.name} position={user.position} role="ADMIN" />
    <main className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
        <p className="text-sm font-bold text-[#0868D7]">Laporan operasional</p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-[#2B3C5A]">Rekap absensi</h1>
        </div>
        <a href={`/api/admin/records.csv?month=${encodeURIComponent(month)}${employeeId ? `&employee=${encodeURIComponent(employeeId)}` : ""}`} className="button-secondary"><DownloadSimple size={20} aria-hidden="true" />Unduh CSV</a>
      </section>

      <form method="get" className="surface grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Bulan<input type="month" name="month" defaultValue={month} className="field font-normal" /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Karyawan<select name="employee" defaultValue={employeeId} className="field font-normal"><option value="">Semua karyawan</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
        <button className="button-primary">Tampilkan</button>
      </form>

      <section className="grid gap-4 min-[420px]:grid-cols-3" aria-label="Ringkasan rekap">
        <article className="surface p-5"><CalendarBlank size={22} className="text-[#1A82FF]" aria-hidden="true" /><p className="mt-4 text-sm text-slate-500">Jumlah sesi</p><p className="number mt-1 text-2xl font-bold text-[#2B3C5A]">{sessions.length}</p></article>
        <article className="surface p-5"><UsersThree size={22} className="text-[#1A82FF]" aria-hidden="true" /><p className="mt-4 text-sm text-slate-500">Karyawan</p><p className="number mt-1 text-2xl font-bold text-[#2B3C5A]">{uniqueEmployees}</p></article>
        <article className="surface p-5"><Clock size={22} className="text-[#1A82FF]" aria-hidden="true" /><p className="mt-4 text-sm text-slate-500">Total waktu</p><p className="number mt-1 text-2xl font-bold text-[#2B3C5A]">{formatMinutes(totalMinutes)}</p></article>
      </section>

      <section className="surface overflow-hidden">
        {sessions.length ? <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-6 py-3">Karyawan</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Lokasi</th><th className="px-4 py-3">Durasi / status</th><th className="px-4 py-3">Bukti</th><th className="px-6 py-3">Detail</th></tr></thead><tbody className="divide-y divide-slate-100">{sessions.map((session) => <tr key={session.id}><td className="px-6 py-4 font-bold text-slate-900">{session.employee.name}</td><td className="number px-4 py-4">{formatDateTime(session.clockInAt, timezone)}</td><td className="px-4 py-4">{session.location?.name ?? "Tanpa lokasi"}</td><td className="number px-4 py-4">{attendanceStatusLabel(session.status, session.durationMinutes)}</td><td className="number px-4 py-4">{session.evidences.length}</td><td className="px-6 py-4"><Link href={`/admin/sessions/${session.id}`} className="font-bold text-[#0868D7] hover:underline">Buka</Link></td></tr>)}</tbody></table></div> : <p className="px-6 py-14 text-center text-sm text-slate-500">Tidak ada sesi untuk filter ini.</p>}
      </section>
    </main>
  </div>;
}
