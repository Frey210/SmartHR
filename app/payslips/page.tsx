import Link from "next/link";
import { AppHeader } from "@/app/_components/app-header";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { lastPayrollDate, payrollDate, rupiah } from "@/lib/payroll";
import type { UserRole } from "@/lib/roles";

export default async function MyPayslipsPage() {
  const user = await requireUser();
  const slips = await db.payslip.findMany({ where: { employeeId: user.id, status: "PUBLISHED" }, include: { period: true }, orderBy: { period: { key: "desc" } } });
  return <><AppHeader name={user.name} position={user.position} role={user.role as UserRole} /><main id="main-content" className="mx-auto grid max-w-3xl gap-5 px-4 py-6 pb-28 sm:px-6 lg:py-10">
    <section><h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-slate-800">Slip gaji saya</h1><p className="mt-2 text-sm leading-6 text-slate-600">Slip pribadi yang sudah ditinjau dan diterbitkan HR/Admin.</p></section>
    <section className="surface overflow-hidden">{slips.length ? <div className="divide-y divide-slate-200">{slips.map((slip) => <article key={slip.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><h2 className="font-bold text-slate-900">Pembayaran {slip.period.key}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{payrollDate(slip.period.startDate)} – {payrollDate(lastPayrollDate(slip.period.endDate))}</p><p className="number mt-2 text-lg font-bold text-slate-900">{rupiah(slip.netPay)}</p></div><Link href={`/payslips/${slip.id}`} className="button-secondary">Lihat slip</Link></article>)}</div> : <div className="px-6 py-12 text-center"><h2 className="font-bold text-slate-800">Belum ada slip diterbitkan</h2><p className="mt-2 text-sm leading-6 text-slate-600">Slip akan muncul setelah HR/Admin meninjau dan menerbitkannya. Hubungi HR jika memerlukan informasi.</p></div>}</section>
  </main></>;
}
