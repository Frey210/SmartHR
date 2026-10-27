import Image from "next/image";
import type { PayrollPeriod, Payslip } from "@/generated/prisma/client";
import { adjustmentLabels, lastPayrollDate, payrollDate, rupiah, type PayrollAdjustments, type PayrollProfileSnapshot } from "@/lib/payroll";

export function PayslipDocument({ slip }: { slip: Payslip & { period: PayrollPeriod } }) {
  const p: PayrollProfileSnapshot = JSON.parse(slip.profileSnapshot);
  const a: PayrollAdjustments = JSON.parse(slip.adjustments);
  const income = [["Gaji pokok", p.baseSalary], ["Tunjangan transportasi", slip.paidDays * p.transportRate], ["Tunjangan komunikasi", p.communicationAllowance], [adjustmentLabels.kpi, a.kpi], [adjustmentLabels.overtime, a.overtime], [adjustmentLabels.position, a.position], [adjustmentLabels.holiday, a.holiday]] as const;
  return <article className="payslip-document surface overflow-hidden p-5 sm:p-8" aria-label="Dokumen slip gaji">
    <header className="flex items-center gap-4 border-b-2 border-slate-800 pb-5">
      <Image src="/mtc-logo.jpg" width={64} height={64} alt="Logo MTC" className="shrink-0 rounded-xl" />
      <div><p className="text-lg font-bold text-slate-900">PT Media Teknologi Celebes</p><h2 className="mt-1 text-base font-bold text-slate-800">Slip gaji karyawan · {slip.period.key}</h2><p className="mt-1 text-sm text-slate-600">{payrollDate(slip.period.startDate)} – {payrollDate(lastPayrollDate(slip.period.endDate))}</p></div>
    </header>
    {slip.status !== "PUBLISHED" ? <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">DRAFT · Belum diterbitkan kepada pegawai</p> : null}
    <div className="payslip-columns mt-6 grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
      <section><h3 className="border-b border-slate-300 pb-2 font-bold text-slate-900">Data karyawan</h3><dl className="mt-3 grid gap-3 text-sm">
        {[["Nama", p.name], ["Username", p.username], ["NIK KTP", p.nationalId || "Belum diisi"], ["Jabatan", p.position], ["Status/tanggungan", p.taxStatus], ["Hari masuk ekuivalen", `${slip.earnedDays} hari`], ["Hari dibayar", `${slip.paidDays} hari (maks. ${p.maxPaidDays})`], ["Izin", `${a.leaveDays} hari`], ["Sakit", `${a.sickDays} hari`], ["Alpha", `${a.absentDays} hari`], ["Tanpa keterangan", `${a.unexplainedDays} hari`]].map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-3"><dt className="text-slate-600">{label}</dt><dd className="break-words font-medium text-slate-900">{value}</dd></div>)}
      </dl><div className="mt-5 border-t border-slate-200 pt-3 text-sm leading-6 text-slate-600"><p>Total sah: {Math.floor(slip.totalMinutes / 60)} jam {slip.totalMinutes % 60} menit.</p><p>1 hari = {slip.period.minutesPerDay} menit. Sisa {slip.remainderMinutes} menit tidak dibawa ke periode berikutnya.</p><p>Transport: {slip.paidDays} hari × {rupiah(p.transportRate)}.</p></div></section>
      <section><h3 className="border-b border-slate-300 pb-2 font-bold text-slate-900">Data gaji</h3><dl className="mt-3 grid gap-3 text-sm">
        {income.map(([label, value]) => <div key={label} className="flex items-baseline justify-between gap-3"><dt className="min-w-0 text-slate-700">{label}</dt><dd className="number shrink-0 text-right font-medium text-slate-900">{rupiah(value)}</dd></div>)}
        <div className="mt-1 flex justify-between gap-3 border-t border-slate-300 pt-3 font-bold text-slate-900"><dt>Gaji bruto</dt><dd className="number shrink-0">{rupiah(slip.grossPay)}</dd></div>
        <div className="flex justify-between gap-3 text-slate-700"><dt>Potongan PPh 21</dt><dd className="number shrink-0">{rupiah(a.incomeTax)}</dd></div>
        <div className="flex justify-between gap-3 text-slate-700"><dt>Potongan tambahan</dt><dd className="number shrink-0">{rupiah(a.otherDeduction)}</dd></div>
        <div className="mt-1 flex flex-wrap justify-between gap-2 border-y-2 border-slate-800 py-4 text-base font-bold text-slate-900"><dt>Jumlah yang diterima</dt><dd className="number">{rupiah(slip.netPay)}</dd></div>
      </dl><div className="mt-6 text-sm leading-6 text-slate-700"><p>{slip.period.city}, {payrollDate(slip.period.payDate)}</p><p>Dibuat oleh</p><p className="mt-5 font-bold text-slate-900">{slip.period.signerName}</p><p>{slip.period.signerPosition}</p><p className="mt-3 text-xs text-slate-600">{slip.status === "PUBLISHED" ? `Disetujui dan diterbitkan ${new Intl.DateTimeFormat("id-ID", { timeZone: slip.period.timezone, dateStyle: "long" }).format(slip.publishedAt!)}.` : "Menunggu tinjauan HR/Admin."}</p></div></section>
    </div>
    {a.note ? <section className="mt-6 border-t border-slate-200 pt-4"><h3 className="text-sm font-bold text-slate-800">Catatan</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{a.note}</p></section> : null}
    <p className="mt-6 border-t border-slate-200 pt-3 text-xs text-slate-600">Referensi: {slip.id}. Dokumen privat. Penerbitan slip bukan konfirmasi transfer pembayaran.</p>
  </article>;
}
