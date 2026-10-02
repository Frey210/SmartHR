/* eslint-disable @next/next/no-img-element -- bukti privat membutuhkan cookie browser */
import { CalendarBlank, Clock, FileImage, MapPin } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { attendanceStatusLabel } from "@/lib/attendance";
import { businessDate, formatDateTime, formatMinutes } from "@/lib/date";
import { db } from "@/lib/db";
import { monthRange } from "@/lib/month";

export default async function EmployeeHistoryPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser("EMPLOYEE");
  const settings = await db.appSetting.findUnique({ where: { id: 1 } });
  const timezone = settings?.timezone ?? "Asia/Singapore";
  const query = await searchParams;
  const range = monthRange(query.month, businessDate(timezone).slice(0, 7));
  const sessions = await db.attendanceSession.findMany({
    where: { employeeId: user.id, businessDate: { gte: range.start, lte: range.end } },
    include: { location: true, evidences: { where: { deletedAt: null } } },
    orderBy: { clockInAt: "desc" },
  });
  const totalMinutes = sessions.reduce((sum, session) => sum + (session.durationMinutes ?? 0), 0);

  return <main id="main-content" className="mx-auto grid max-w-5xl gap-5 px-4 py-5 pb-28 sm:px-6 lg:gap-6 lg:px-8 lg:py-10">
    <section>
      <p className="text-sm font-bold text-[#0868D7]">Catatan pribadi</p>
      <h1 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold tracking-[-0.025em] text-[#2B3C5A] sm:text-3xl">Riwayat absensi</h1>
    </section>
    <form method="get" className="surface flex items-end gap-3 p-4 sm:p-5">
      <label className="grid min-w-0 flex-1 gap-2 text-sm font-bold text-slate-700">Bulan
        <input type="month" name="month" defaultValue={range.month} className="field font-normal" />
      </label>
      <button className="button-primary shrink-0 px-4">Tampilkan</button>
    </form>
    <section className="grid grid-cols-2 gap-3" aria-label="Ringkasan riwayat">
      <article className="surface p-4 sm:p-5"><CalendarBlank size={22} className="text-[#1A82FF]" aria-hidden="true" /><p className="mt-4 text-xs text-slate-500 sm:text-sm">Jumlah sesi</p><p className="number mt-1 text-xl font-bold text-[#2B3C5A] sm:text-2xl">{sessions.length}</p></article>
      <article className="surface p-4 sm:p-5"><Clock size={22} className="text-[#1A82FF]" aria-hidden="true" /><p className="mt-4 text-xs text-slate-500 sm:text-sm">Total waktu</p><p className="number mt-1 text-xl font-bold text-[#2B3C5A] sm:text-2xl">{formatMinutes(totalMinutes)}</p></article>
    </section>
    <section className="grid gap-4">
      {sessions.length ? sessions.map((session) => <article key={session.id} className="surface overflow-hidden">
        <div className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div><p className="number font-bold text-slate-900">{formatDateTime(session.clockInAt, timezone)}</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><MapPin size={16} aria-hidden="true" />{session.location?.name ?? "Tanpa lokasi"}</p></div>
          <div className="text-left sm:text-right"><p className="number font-bold text-[#2B3C5A]">{attendanceStatusLabel(session.status, session.durationMinutes)}</p><p className="mt-1 flex items-center gap-1 text-sm text-slate-500 sm:justify-end"><FileImage size={16} aria-hidden="true" />{session.evidences.length} bukti</p></div>
        </div>
        {session.evidences.length ? <div className="grid gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-2">{session.evidences.map((evidence) => <div key={evidence.id} className="bg-white p-4"><div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"><img src={`/api/evidence/${evidence.id}`} alt={`Dokumentasi ${evidence.originalFilename}`} loading="lazy" decoding="async" className="size-full object-contain" /></div><p className="mt-3 text-sm leading-6 text-slate-600">{evidence.description}</p></div>)}</div> : null}
      </article>) : <div className="surface px-6 py-14 text-center text-sm text-slate-500">Belum ada sesi pada bulan ini.</div>}
    </section>
  </main>;
}
