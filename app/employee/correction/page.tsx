import { ArrowLeft, ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dateTimeLocalValue, formatDateTime } from "@/lib/date";
import { db } from "@/lib/db";
import { AttendanceCorrectionRequest } from "../attendance-control";

export default async function EmployeeCorrectionPage() {
  const user = await requireUser("EMPLOYEE");
  const settings = await db.appSetting.findUnique({ where: { id: 1 } });
  const timezone = settings?.timezone ?? "Asia/Singapore";
  const [unresolved, pendingCorrections] = await Promise.all([
    db.attendanceSession.findMany({
      where: { employeeId: user.id, status: { in: ["OPEN", "INCOMPLETE"] } },
      include: { correctionRequests: { where: { status: "PENDING" } } },
      orderBy: { clockInAt: "desc" },
    }),
    db.clockOutRequest.count({ where: { status: "PENDING", attendanceSession: { employeeId: user.id } } }),
  ]);
  const sessions = unresolved
    .filter((session) => !session.correctionRequests.length)
    .map((session) => ({ id: session.id, label: `Clock in ${formatDateTime(session.clockInAt, timezone)}` }));

  return <main id="main-content" className="mx-auto grid max-w-2xl gap-5 px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:py-10">
    <section>
      <Link href="/employee" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-bold text-slate-600 hover:text-[#0868D7]"><ArrowLeft size={19} weight="bold" aria-hidden="true" /> Kembali</Link>
      <div className="mt-3 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0868D7]"><ClockCounterClockwise size={24} weight="bold" aria-hidden="true" /></span>
        <div>
          <p className="text-sm font-bold text-[#0868D7]">Pengajuan ke admin</p>
          <h1 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold tracking-[-0.025em] text-[#2B3C5A] sm:text-3xl">Koreksi absensi</h1>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">Gunakan jika lupa clock in atau clock out. Perubahan berlaku setelah disetujui admin.</p>
    </section>
    {pendingCorrections ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">{pendingCorrections} koreksi sedang menunggu admin. Anda tetap dapat memulai sesi hari berikutnya.</p> : null}
    <section className="surface p-5 sm:p-6">
      <AttendanceCorrectionRequest
        sessions={sessions}
        defaultStartTime={dateTimeLocalValue(new Date(new Date().getTime() - 3_600_000), timezone)}
        defaultEndTime={dateTimeLocalValue(new Date(), timezone)}
      />
    </section>
  </main>;
}
