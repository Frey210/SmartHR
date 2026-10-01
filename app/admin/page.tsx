import { Clock, FileImage, MapPin, Timer, UsersThree } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AppHeader } from "@/app/_components/app-header";
import { ConfirmSubmit } from "@/app/_components/confirm-submit";
import { LocationMap } from "@/app/_components/location-map";
import { requireUser } from "@/lib/auth";
import { businessDate, formatDateTime, formatMinutes } from "@/lib/date";
import { db } from "@/lib/db";
import { LocationForm } from "./location-form";
import { EmployeeForm, TimezoneForm } from "./admin-forms";
import { deleteEvidenceAction, resetEmployeePasswordAction, reviewClockOutRequestAction, toggleEmployeeAction, toggleLocationAction } from "./actions";

export default async function AdminPage() {
  const user = await requireUser("ADMIN");
  const settings = await db.appSetting.findUnique({ where: { id: 1 } });
  const timezone = settings?.timezone ?? "Asia/Singapore";
  const today = businessDate(timezone);

  const [employees, locations, sessions, requests] = await Promise.all([
    db.user.findMany({ where: { role: "EMPLOYEE" }, orderBy: { name: "asc" } }),
    db.attendanceLocation.findMany({ orderBy: { createdAt: "desc" } }),
    db.attendanceSession.findMany({
      where: { businessDate: today },
      include: { employee: true, location: true, evidences: { where: { deletedAt: null } } },
      orderBy: { clockInAt: "desc" },
    }),
    db.clockOutRequest.findMany({ where: { status: "PENDING" }, include: { attendanceSession: { include: { employee: true, evidences: { where: { deletedAt: null }, select: { id: true } } } } }, orderBy: { createdAt: "asc" } }),
  ]);

  const activeCount = sessions.filter((session) => session.status === "OPEN").length;
  const enabledEmployees = employees.filter((employee) => employee.isActive).length;
  const totalMinutes = sessions.reduce((total, session) => total + (session.durationMinutes ?? 0), 0);
  const stats = [
    { label: "Karyawan aktif", value: enabledEmployees, icon: UsersThree },
    { label: "Sedang bekerja", value: activeCount, icon: Clock },
    { label: "Sesi hari ini", value: sessions.length, icon: MapPin },
    { label: "Jam tercatat", value: formatMinutes(totalMinutes), icon: Timer },
  ];

  return (
    <div className="min-h-[100dvh]">
      <AppHeader name={user.name} position={user.position} role="ADMIN" />
      <main className="mx-auto grid max-w-[1400px] gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section>
          <p className="text-sm font-bold text-[#0868D7]">Ringkasan operasional</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-[-0.025em] text-[#2B3C5A]">Dashboard kehadiran</h1>
              <p className="mt-2 text-slate-600">Data {new Intl.DateTimeFormat("id-ID", { timeZone: timezone, dateStyle: "full" }).format(new Date())}</p>
            </div>
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">Zona waktu: {timezone}</span>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Statistik hari ini">
          {stats.map(({ label, value, icon: Icon }) => (
            <article key={label} className="surface p-5">
              <Icon size={24} className="text-[#1A82FF]" aria-hidden="true" />
              <p className="mt-5 text-sm text-slate-500">{label}</p>
              <p className="number mt-1 text-2xl font-bold text-[#2B3C5A]">{value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Pemantauan hari ini</h2>
                <p className="mt-1 text-sm text-slate-500">Sesi masuk karyawan pada tanggal bisnis aktif.</p>
              </div>
            </div>
            {sessions.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-3 font-bold">Karyawan</th>
                      <th className="px-4 py-3 font-bold">Lokasi</th>
                      <th className="px-4 py-3 font-bold">Clock in</th>
                      <th className="px-4 py-3 font-bold">Durasi</th>
                      <th className="px-6 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((session) => (
                      <tr key={session.id} className="text-slate-700 hover:bg-slate-50/70">
                        <td className="px-6 py-4">
                          <Link href={`/admin/sessions/${session.id}`} className="font-bold text-[#0868D7] hover:underline">{session.employee.name}</Link>
                          <p className="mt-1 text-xs text-slate-500">{session.employee.position}</p>
                        </td>
                        <td className="px-4 py-4">{session.location?.name ?? "Lokasi dihapus"}</td>
                        <td className="number px-4 py-4">{formatDateTime(session.clockInAt, timezone)}</td>
                        <td className="number px-4 py-4">{session.durationMinutes == null ? "Berjalan" : formatMinutes(session.durationMinutes)}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${session.status === "OPEN" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                            {session.status === "OPEN" ? "Aktif" : "Selesai"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-14 text-center">
                <Clock size={32} className="mx-auto text-slate-400" aria-hidden="true" />
                <p className="mt-3 font-bold text-slate-700">Belum ada sesi hari ini</p>
                <p className="mt-1 text-sm text-slate-500">Data akan muncul setelah karyawan melakukan clock in.</p>
              </div>
            )}
          </div>

          <aside className="surface p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Tambah lokasi absensi</h2>
            <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">Karyawan dapat clock in dari lokasi aktif terdekat dalam radius 50 meter.</p>
            <LocationForm locations={locations.map(({ id, name, latitude, longitude, radiusM, isActive }) => ({ id, name, latitude, longitude, radiusM, isActive }))} />
          </aside>
        </section>

        {requests.length ? <section className="surface overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Persetujuan clock out manual</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {requests.map((request) => <article key={request.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="font-bold text-slate-900">{request.attendanceSession.employee.name}</p>
                <p className="mt-1 text-sm text-slate-600">Usulan: {formatDateTime(request.requestedClockOutAt, timezone)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{request.reason}</p>
                <Link href={`/admin/sessions/${request.attendanceSessionId}`} className="mt-2 inline-flex text-sm font-bold text-[#0868D7] hover:underline">Lihat {request.attendanceSession.evidences.length} foto dokumentasi</Link>
              </div>
              <form action={reviewClockOutRequestAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="requestId" value={request.id} />
                <button name="decision" value="REJECTED" className="button-secondary">Tolak</button>
                <button name="decision" value="APPROVED" className="button-primary">Setujui</button>
              </form>
            </article>)}
          </div>
        </section> : null}

        <section className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <div className="surface overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Kelola karyawan</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {employees.map((employee) => <article key={employee.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="font-bold text-slate-900">{employee.name}</p>
                  <p className="mt-1 text-sm text-slate-500">@{employee.username} · {employee.position}</p>
                  <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${employee.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{employee.isActive ? "Aktif" : "Nonaktif"}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(150px,1fr)_auto]">
                  <form action={resetEmployeePasswordAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input type="hidden" name="userId" value={employee.id} />
                    <input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field min-w-0" placeholder="Password baru" aria-label={`Password baru untuk ${employee.name}`} />
                    <ConfirmSubmit className="button-secondary shrink-0" message={`Reset password ${employee.name}?`}>Reset</ConfirmSubmit>
                  </form>
                  <form action={toggleEmployeeAction}>
                    <input type="hidden" name="userId" value={employee.id} />
                    <ConfirmSubmit className={employee.isActive ? "button-danger w-full" : "button-secondary w-full"} message={`${employee.isActive ? "Nonaktifkan" : "Aktifkan"} akun ${employee.name}?`}>{employee.isActive ? "Nonaktifkan" : "Aktifkan"}</ConfirmSubmit>
                  </form>
                </div>
              </article>)}
            </div>
          </div>
          <div className="grid content-start gap-6">
            <aside className="surface p-5 sm:p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Tambah karyawan</h2>
              <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">Buat username dan password awal yang nantinya dapat diganti oleh pengguna.</p>
              <EmployeeForm />
            </aside>
            <aside className="surface p-5 sm:p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Pengaturan waktu</h2>
              <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">Zona waktu dipakai untuk menentukan tanggal bisnis dan tampilan jam.</p>
              <TimezoneForm current={timezone} />
            </aside>
          </div>
        </section>

        <section className="surface overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Lokasi absensi</h2>
          </div>
          {locations.length ? (
            <>
            <LocationMap locations={locations.map(({ id, name, latitude, longitude, radiusM, isActive }) => ({ id, name, latitude, longitude, radiusM, isActive }))} label="Peta seluruh lokasi absensi" />
            <div className="grid gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-2 xl:grid-cols-3">
              {locations.map((location) => (
                <article key={location.id} className="bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{location.name}</h3>
                      <p className="number mt-2 text-sm text-slate-500">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${location.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{location.isActive ? "Aktif" : "Nonaktif"}</span>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">Radius {location.radiusM} meter</p>
                  <form action={toggleLocationAction} className="mt-4">
                    <input type="hidden" name="locationId" value={location.id} />
                    <button className="button-secondary w-full">{location.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
                  </form>
                </article>
              ))}
            </div>
            </>
          ) : (
            <p className="px-6 py-10 text-center text-sm text-slate-500">Belum ada lokasi. Tambahkan lokasi pertama melalui formulir di atas.</p>
          )}
        </section>

        <section className="surface overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Dokumentasi hari ini</h2>
          </div>
          {sessions.some((session) => session.evidences.length) ? <div className="divide-y divide-slate-100">
            {sessions.flatMap((session) => session.evidences.map((evidence) => <article key={evidence.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-bold text-slate-900"><FileImage size={20} className="shrink-0 text-[#1A82FF]" aria-hidden="true" />{evidence.originalFilename}</p>
                <p className="mt-1 text-sm text-slate-500">{session.employee.name} · {(evidence.sizeBytes / 1024).toFixed(0)} KB</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{evidence.description}</p>
              </div>
              <form action={deleteEvidenceAction}>
                <input type="hidden" name="evidenceId" value={evidence.id} />
                <ConfirmSubmit className="button-danger" message={`Hapus foto ${evidence.originalFilename}? Metadata audit tetap disimpan.`}>Hapus foto</ConfirmSubmit>
              </form>
            </article>))}
          </div> : <p className="px-6 py-10 text-center text-sm text-slate-500">Belum ada dokumentasi pekerjaan hari ini.</p>}
        </section>
      </main>
    </div>
  );
}
