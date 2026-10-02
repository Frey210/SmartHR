import { ArrowRight, Clock, MapPin, NotePencil, Timer } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { LiveServerClock } from "@/app/_components/live-server-clock";
import { requireUser } from "@/lib/auth";
import { attendanceStatusLabel } from "@/lib/attendance";
import { businessDate, formatDateTime, formatMinutes } from "@/lib/date";
import { db } from "@/lib/db";

export default async function EmployeePage() {
  const user = await requireUser("EMPLOYEE");
  const settings = await db.appSetting.findUnique({ where: { id: 1 } });
  const timezone = settings?.timezone ?? "Asia/Singapore";
  const today = businessDate(timezone);
  const [sessions, activeLocationCount, unresolved, pendingCorrections] = await Promise.all([
    db.attendanceSession.findMany({
      where: { employeeId: user.id, businessDate: today },
      include: { location: true },
      orderBy: { clockInAt: "desc" },
    }),
    db.attendanceLocation.count({ where: { isActive: true } }),
    db.attendanceSession.findMany({
      where: { employeeId: user.id, status: { in: ["OPEN", "INCOMPLETE"] } },
      select: { status: true, businessDate: true },
    }),
    db.clockOutRequest.count({ where: { status: "PENDING", attendanceSession: { employeeId: user.id } } }),
  ]);
  const active = sessions.find((session) => session.status === "OPEN");
  const staleOpen = unresolved.some((session) => session.status === "OPEN" && session.businessDate !== today);
  const totalMinutes = sessions.reduce((total, session) => total + (session.durationMinutes ?? 0), 0);

  return <main id="main-content" className="mx-auto grid max-w-5xl gap-5 px-4 py-5 pb-28 sm:px-6 lg:gap-6 lg:px-8 lg:py-10">
    <section className="overflow-hidden rounded-[22px] bg-[#2B3C5A] text-white shadow-[0_18px_48px_rgba(43,60,90,0.2)]">
      <div className="grid gap-6 px-5 py-6 sm:grid-cols-[1fr_auto] sm:items-end sm:px-7 sm:py-7">
        <div>
          <p className="text-sm font-medium text-blue-200">Selamat bekerja</p>
          <h1 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold tracking-[-0.025em] sm:text-3xl">Halo, {user.name.split(" ")[0]}</h1>
        </div>
        <LiveServerClock serverNow={new Date().getTime()} timeZone={timezone} />
      </div>
      <div className="border-t border-white/10 px-5 py-5 sm:px-7">
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <span className={`size-2.5 rounded-full ${active ? "bg-emerald-400" : staleOpen ? "bg-amber-400" : "bg-slate-400"}`} aria-hidden="true" />
          {active ? "Sesi sedang berjalan" : staleOpen ? "Sesi lama perlu dikoreksi" : "Tidak ada sesi aktif"}
        </div>
        <Link href="/employee/attendance" className="mt-4 flex min-h-14 w-full items-center justify-between rounded-xl bg-white px-4 font-bold text-[#2B3C5A] shadow-sm transition-colors hover:bg-blue-50">
          <span>{active ? "Lanjutkan ke clock out" : "Mulai absensi"}</span>
          <ArrowRight size={21} weight="bold" aria-hidden="true" />
        </Link>
        {!activeLocationCount ? <p className="mt-3 text-sm leading-6 text-amber-200">Belum ada titik absensi aktif. Hubungi admin.</p> : null}
      </div>
    </section>

    <section aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="mb-3 font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Akses cepat</h2>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/employee/attendance" className="surface flex min-h-28 flex-col justify-between p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50">
          <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-[#0868D7]"><MapPin size={22} weight="fill" aria-hidden="true" /></span>
          <span className="font-bold text-slate-800">Absensi</span>
        </Link>
        <Link href="/employee/correction" className="surface relative flex min-h-28 flex-col justify-between p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50">
          <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-[#2B3C5A]"><NotePencil size={22} weight="bold" aria-hidden="true" /></span>
          <span className="font-bold text-slate-800">Koreksi absen</span>
          {pendingCorrections ? <span className="absolute right-3 top-3 flex min-w-6 justify-center rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900" aria-label={`${pendingCorrections} koreksi menunggu`}>{pendingCorrections}</span> : null}
        </Link>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3" aria-label="Ringkasan hari ini">
      <article className="surface p-4 sm:p-5">
        <Timer size={23} className="text-[#1A82FF]" aria-hidden="true" />
        <p className="mt-4 text-xs font-medium text-slate-500 sm:text-sm">Total hari ini</p>
        <p className="number mt-1 text-xl font-bold text-[#2B3C5A] sm:text-2xl">{formatMinutes(totalMinutes)}</p>
      </article>
      <article className="surface p-4 sm:p-5">
        <Clock size={23} className="text-[#1A82FF]" aria-hidden="true" />
        <p className="mt-4 text-xs font-medium text-slate-500 sm:text-sm">Jumlah sesi</p>
        <p className="number mt-1 text-xl font-bold text-[#2B3C5A] sm:text-2xl">{sessions.length}</p>
      </article>
    </section>

    <section className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Sesi hari ini</h2>
        <Link href="/employee/history" className="text-sm font-bold text-[#0868D7]">Lihat riwayat</Link>
      </div>
      {sessions.length ? <div className="divide-y divide-slate-100">
        {sessions.map((session) => <article key={session.id} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="number font-bold text-slate-800">{formatDateTime(session.clockInAt, timezone)}</p>
            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500"><MapPin size={16} className="shrink-0" aria-hidden="true" /> {session.location?.name ?? "Lokasi dihapus"}</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${session.status === "OPEN" ? "bg-emerald-100 text-emerald-800" : session.status === "PENDING" ? "bg-amber-100 text-amber-900" : session.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>
            {session.status === "OPEN" ? "Aktif" : attendanceStatusLabel(session.status, session.durationMinutes)}
          </span>
        </article>)}
      </div> : <p className="px-5 py-10 text-center text-sm leading-6 text-slate-500">Belum ada sesi yang tercatat hari ini.</p>}
    </section>
  </main>;
}
