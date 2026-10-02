import { ArrowLeft, CheckCircle, MapPin } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { EmployeeLocationPreview } from "@/app/_components/location-map";
import { requireUser } from "@/lib/auth";
import { businessDate, formatDateTime } from "@/lib/date";
import { db } from "@/lib/db";
import { AttendanceControl } from "../attendance-control";

export default async function EmployeeAttendancePage() {
  const user = await requireUser("EMPLOYEE");
  const settings = await db.appSetting.findUnique({ where: { id: 1 } });
  const timezone = settings?.timezone ?? "Asia/Singapore";
  const today = businessDate(timezone);
  const [locations, active] = await Promise.all([
    db.attendanceLocation.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.attendanceSession.findFirst({ where: { employeeId: user.id, status: "OPEN", businessDate: today } }),
  ]);

  return <main id="main-content" className="mx-auto grid max-w-3xl gap-5 px-4 py-5 pb-28 sm:px-6 lg:gap-6 lg:px-8 lg:py-10">
    <section>
      <Link href="/employee" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-bold text-slate-600 hover:text-[#0868D7]">
        <ArrowLeft size={19} weight="bold" aria-hidden="true" /> Kembali
      </Link>
      <p className="mt-3 text-sm font-bold text-[#0868D7]">Absensi karyawan</p>
      <h1 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold tracking-[-0.025em] text-[#2B3C5A] sm:text-3xl">{active ? "Selesaikan sesi kerja" : "Mulai sesi kerja"}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Periksa posisi Anda pada peta, lalu konfirmasi absensi. Titik harus berada maksimal 50 meter dari lokasi aktif.</p>
    </section>

    <ol className="grid grid-cols-2 gap-2" aria-label="Tahapan absensi">
      <li className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-3 text-sm font-bold text-[#0868D7]"><span className="flex size-7 items-center justify-center rounded-full bg-[#1A82FF] text-xs text-white">1</span> Periksa lokasi</li>
      <li className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200"><span className="flex size-7 items-center justify-center rounded-full bg-[#2B3C5A] text-xs text-white">2</span> Konfirmasi</li>
    </ol>

    {locations.length ? <EmployeeLocationPreview locations={locations} /> : <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950"><MapPin size={20} className="mt-0.5 shrink-0" aria-hidden="true" /> Admin belum menambahkan lokasi absensi aktif.</p>}

    <section className="surface p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0868D7]"><CheckCircle size={23} weight="fill" aria-hidden="true" /></span>
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">{active ? "Dokumentasi dan clock out" : "Konfirmasi clock in"}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{active ? `Sesi dimulai ${formatDateTime(active.clockInAt, timezone)}. Tambahkan dokumentasi sebelum mengakhiri sesi.` : "Sistem akan membaca ulang GPS saat Anda mengonfirmasi."}</p>
        </div>
      </div>
      <AttendanceControl hasOpenSession={Boolean(active)} hasLocations={locations.length > 0} />
    </section>
  </main>;
}
