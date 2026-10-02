import { Clock, MapPin, Timer } from "@phosphor-icons/react/dist/ssr";
import { AppHeader } from "@/app/_components/app-header";
import { EmployeeLocationPreview } from "@/app/_components/location-map";
import { LiveServerClock } from "@/app/_components/live-server-clock";
import { requireUser } from "@/lib/auth";
import { attendanceStatusLabel } from "@/lib/attendance";
import { businessDate, dateTimeLocalValue, formatDateTime, formatMinutes } from "@/lib/date";
import { db } from "@/lib/db";
import { AttendanceControl, AttendanceCorrectionRequest } from "./attendance-control";

export default async function EmployeePage() {
  const user = await requireUser("EMPLOYEE");
  const settings = await db.appSetting.findUnique({ where: { id: 1 } });
  const timezone = settings?.timezone ?? "Asia/Singapore";
  const today = businessDate(timezone);
  const [sessions, locations, unresolved, pendingCorrections] = await Promise.all([
    db.attendanceSession.findMany({
      where: { employeeId: user.id, businessDate: today },
      include: { location: true },
      orderBy: { clockInAt: "desc" },
    }),
    db.attendanceLocation.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.attendanceSession.findMany({
      where: { employeeId: user.id, status: { in: ["OPEN", "INCOMPLETE"] } },
      include: { correctionRequests: { where: { status: "PENDING" } } },
      orderBy: { clockInAt: "desc" },
    }),
    db.clockOutRequest.count({ where: { status: "PENDING", attendanceSession: { employeeId: user.id } } }),
  ]);
  const active = unresolved.find((session) => session.status === "OPEN" && session.businessDate === today);
  const staleOpen = unresolved.some((session) => session.status === "OPEN" && session.businessDate !== today);
  const correctableSessions = unresolved
    .filter((session) => !session.correctionRequests.length)
    .map((session) => ({ id: session.id, label: `Clock in ${formatDateTime(session.clockInAt, timezone)}` }));
  const totalMinutes = sessions.reduce((total, session) => total + (session.durationMinutes ?? 0), 0);

  return (
    <div className="min-h-[100dvh]">
      <AppHeader name={user.name} position={user.position} role="EMPLOYEE" />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[20px] bg-[#2B3C5A] text-white shadow-[0_20px_60px_rgba(43,60,90,0.18)]">
          <div className="grid gap-6 border-b border-white/10 px-5 py-6 sm:grid-cols-[1fr_auto] sm:items-end sm:px-7">
            <div>
              <p className="text-sm font-medium text-blue-200">Selamat bekerja</p>
              <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-[-0.025em]">Halo, {user.name.split(" ")[0]}</h1>
            </div>
            <LiveServerClock serverNow={new Date().getTime()} timeZone={timezone} />
          </div>
          <div className="grid gap-6 px-5 py-6 sm:px-7">
            <div>
              <p className="text-sm text-slate-300">Status saat ini</p>
              <p className="mt-1 flex items-center gap-2 text-xl font-bold">
                <span className={`size-2.5 rounded-full ${active ? "bg-emerald-400" : "bg-slate-400"}`} aria-hidden="true" />
                {active ? "Sedang bekerja" : staleOpen ? "Sesi lama perlu dikoreksi" : sessions.length ? "Tidak ada sesi aktif" : "Belum ada sesi"}
              </p>
            </div>
            <AttendanceControl hasOpenSession={Boolean(active)} hasLocations={locations.length > 0} />
            {active ? (
              <p className="rounded-xl bg-white/10 px-4 py-3 text-sm leading-6 text-slate-100">
                Sesi dimulai {formatDateTime(active.clockInAt, timezone)}. Clock out memerlukan lokasi dan minimal satu foto dengan deskripsinya.
              </p>
            ) : null}
          </div>
        </section>

        <section className="grid content-start gap-6">
          {locations.length ? <EmployeeLocationPreview locations={locations} /> : null}
          <div className="grid grid-cols-2 gap-4">
            <div className="surface p-5">
              <Timer size={24} className="text-[#1A82FF]" aria-hidden="true" />
              <p className="mt-5 text-sm text-slate-500">Total hari ini</p>
              <p className="number mt-1 text-2xl font-bold text-[#2B3C5A]">{formatMinutes(totalMinutes)}</p>
            </div>
            <div className="surface p-5">
              <Clock size={24} className="text-[#1A82FF]" aria-hidden="true" />
              <p className="mt-5 text-sm text-slate-500">Jumlah sesi</p>
              <p className="number mt-1 text-2xl font-bold text-[#2B3C5A]">{sessions.length}</p>
            </div>
          </div>

          <div className="surface overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Sesi hari ini</h2>
            </div>
            {sessions.length ? (
              <div className="divide-y divide-slate-100">
                {sessions.map((session) => (
                  <article key={session.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="number font-bold text-slate-800">{formatDateTime(session.clockInAt, timezone)}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin size={16} aria-hidden="true" /> {session.location?.name ?? "Lokasi dihapus"}
                      </p>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${session.status === "OPEN" ? "bg-emerald-100 text-emerald-800" : session.status === "PENDING" ? "bg-amber-100 text-amber-900" : session.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>
                      {session.status === "OPEN" ? "Aktif" : attendanceStatusLabel(session.status, session.durationMinutes)}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="px-5 py-10 text-center text-sm leading-6 text-slate-500">Belum ada sesi yang tercatat hari ini.</p>
            )}
          </div>
          <div className="surface p-5">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Koreksi absensi</h2>
            <p className="mb-5 mt-2 text-sm leading-6 text-slate-500">Gunakan jika lupa clock in atau clock out. Permintaan baru berlaku setelah disetujui admin.</p>
            {pendingCorrections ? <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{pendingCorrections} koreksi sedang menunggu admin. Anda tetap dapat memulai sesi hari berikutnya.</p> : null}
            <AttendanceCorrectionRequest
              sessions={correctableSessions}
              defaultStartTime={dateTimeLocalValue(new Date(new Date().getTime() - 3_600_000), timezone)}
              defaultEndTime={dateTimeLocalValue(new Date(), timezone)}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
