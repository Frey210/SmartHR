import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/app/_components/app-header";
import { PayslipDocument } from "@/app/_components/payslip-document";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { payrollAttendanceSnapshot, payrollDate, type PayrollAdjustments } from "@/lib/payroll";
import { PayslipAdjustmentsForm, PayslipDecisionForm } from "../forms";

export default async function PayrollReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["ADMIN", "HR"]);
  const { id } = await params;
  const slip = await db.payslip.findUnique({ where: { id }, include: { period: true } });
  if (!slip) notFound();
  const sessions = await db.attendanceSession.findMany({ where: { employeeId: slip.employeeId, businessDate: { gte: slip.period.startDate, lt: slip.period.endDate } }, orderBy: { clockInAt: "asc" } });
  const stale = slip.status === "DRAFT" && payrollAttendanceSnapshot(sessions) !== slip.attendanceSnapshot;
  const adjustments: PayrollAdjustments = JSON.parse(slip.adjustments);
  return <><AppHeader name={user.name} position={user.position} role={user.role as "ADMIN" | "HR"} /><main id="main-content" className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:py-10">
    <section><Link href={`/payroll?period=${slip.period.key}`} className="inline-flex min-h-11 items-center text-sm font-bold text-blue-700 hover:underline">Kembali ke payroll</Link><h1 className="mt-2 text-3xl font-bold text-slate-800">{slip.status === "PUBLISHED" ? "Slip telah diterbitkan" : "Tinjau draft slip gaji"}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{slip.status === "PUBLISHED" ? "Nilai slip sudah dikunci. Pegawai dapat melihat dokumen di akunnya." : "Simpan perubahan komponen sebelum menerbitkan. Periksa sesi yang tidak dihitung dan pastikan koreksi absensi telah ditinjau."}</p></section>
    {stale ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Absensi berubah setelah draft dihitung. Gunakan Hitung ulang absensi sebelum menyimpan atau menerbitkan.</p> : null}
    {slip.excludedCount ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{slip.excludedCount} sesi belum lengkap, ditolak, menunggu koreksi, atau tidak valid tidak masuk perhitungan slip ini.</p> : null}
    <PayslipDocument slip={slip} />
    {slip.status === "DRAFT" ? <>
      <section className="surface p-5 sm:p-6"><h2 className="mb-4 text-lg font-bold text-slate-800">Perbarui dasar perhitungan</h2><PayslipDecisionForm id={id} version={slip.version} operation="refresh" isAdmin={user.role === "ADMIN"} /></section>
      <section className="surface p-5 sm:p-6"><h2 className="mb-4 text-lg font-bold text-slate-800">Komponen tambahan dan potongan</h2><PayslipAdjustmentsForm id={id} version={slip.version} adjustments={adjustments} /></section>
      <section className="surface p-5 sm:p-6"><h2 className="mb-4 text-lg font-bold text-slate-800">Persetujuan dan penerbitan</h2><p className="mb-4 text-sm leading-6 text-slate-600">Pegawai baru menerima slip setelah tindakan ini. Penerbitan dapat dilakukan setelah periode perhitungan selesai.</p><PayslipDecisionForm id={id} version={slip.version} operation="publish" /></section>
    </> : <Link href={`/payslips/${id}`} className="button-secondary justify-self-start">Buka dokumen cetak</Link>}
    <details className="surface p-5 sm:p-6"><summary className="min-h-11 cursor-pointer font-bold text-slate-800">Rincian sumber absensi terkini ({sessions.length} sesi)</summary><p className="mt-2 text-sm leading-6 text-slate-600">Daftar ini menampilkan kondisi terkini. Slip terbit mempertahankan snapshot saat ditinjau.</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[450px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-600"><th className="py-3 pr-3">Tanggal</th><th className="p-3">Status</th><th className="py-3 pl-3 text-right">Menit tercatat</th></tr></thead><tbody>{sessions.map((s) => <tr key={s.id} className="border-b border-slate-100"><td className="py-3 pr-3">{payrollDate(s.businessDate)}</td><td className="p-3">{s.status === "CLOSED" ? "Selesai" : "Tidak dihitung"}</td><td className="number py-3 pl-3 text-right">{s.status === "CLOSED" ? s.durationMinutes ?? "—" : "—"}</td></tr>)}</tbody></table></div></details>
  </main></>;
}
