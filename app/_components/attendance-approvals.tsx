import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMinutes } from "@/lib/date";
import { ConfirmSubmit } from "./confirm-submit";
import { reviewAttendanceRequestAction } from "@/app/admin/actions";

export async function AttendanceApprovals({ timezone }: { timezone: string }) {
  await requireUser(["ADMIN", "HR"]);
  const requests = await db.clockOutRequest.findMany({
    where: { status: "PENDING" },
    include: { attendanceSession: { include: { employee: true, evidences: { where: { deletedAt: null }, select: { id: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  return <section id="attendance-approvals" className="surface scroll-mt-28 overflow-hidden" aria-labelledby="approvals-title">
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
      <div>
        <h2 id="approvals-title" className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Persetujuan koreksi absensi</h2>
        <p className="mt-1 text-sm text-slate-600">Periksa waktu, alasan, dan dokumentasi sebelum mengambil keputusan.</p>
      </div>
      <span className="number rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-[#0868D7]" aria-label={`${requests.length} pengajuan menunggu`}>{requests.length}</span>
    </div>
    {requests.length ? <div className="divide-y divide-slate-200">
      {requests.map((request) => {
        const clockInAt = request.requestedClockInAt ?? request.attendanceSession.clockInAt;
        const minutes = Math.max(0, Math.floor((request.requestedClockOutAt.getTime() - clockInAt.getTime()) / 60_000));
        return <article key={request.id} className="grid min-w-0 gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0 break-words">
            <h3 className="font-bold text-slate-900">{request.attendanceSession.employee.name}</h3>
            <p className="mt-1 text-sm font-medium text-[#0868D7]">{request.requestType === "MISSING_SESSION" ? "Lupa clock in" : "Lupa clock out"}</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div><dt className="text-slate-600">Clock in</dt><dd className="number mt-1 font-semibold">{formatDateTime(clockInAt, timezone)}</dd></div>
              <div><dt className="text-slate-600">Clock out diajukan</dt><dd className="number mt-1 font-semibold">{formatDateTime(request.requestedClockOutAt, timezone)}</dd></div>
              <div><dt className="text-slate-600">Durasi jika disetujui</dt><dd className="number mt-1 font-semibold">{formatMinutes(minutes)}</dd></div>
            </dl>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.reason}</p>
            <Link href={`/admin/sessions/${request.attendanceSessionId}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-[#0868D7] hover:underline">Lihat {request.attendanceSession.evidences.length} foto dan detail sesi</Link>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:flex">
            <form action={reviewAttendanceRequestAction}>
              <input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="decision" value="REJECTED" />
              <ConfirmSubmit className="button-secondary w-full" message={`Tolak koreksi ${request.attendanceSession.employee.name}? Durasi tidak dihitung.`}>Tolak</ConfirmSubmit>
            </form>
            <form action={reviewAttendanceRequestAction}>
              <input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="decision" value="APPROVED" />
              <ConfirmSubmit className="button-primary w-full" message={`Setujui koreksi ${request.attendanceSession.employee.name} selama ${formatMinutes(minutes)}? Durasi akan masuk rekap.`}>Setujui</ConfirmSubmit>
            </form>
          </div>
        </article>;
      })}
    </div> : <div className="px-6 py-12 text-center">
      <p className="font-bold text-slate-700">Semua pengajuan sudah ditinjau</p>
      <p className="mt-1 text-sm text-slate-600">Pengajuan baru pegawai akan muncul di sini.</p>
    </div>}
  </section>;
}
