import Link from "next/link";
import { AppHeader } from "@/app/_components/app-header";
import { GeneratePayslipsForm } from "./forms";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { businessDate } from "@/lib/date";
import { lastPayrollDate, payrollDate, rupiah, type PayrollProfileSnapshot } from "@/lib/payroll";

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const user = await requireUser(["ADMIN", "HR"]);
  const query = await searchParams;
  const [settings, periods, company, missingProfiles] = await Promise.all([
    db.payrollSetting.findUnique({ where: { id: 1 } }),
    db.payrollPeriod.findMany({ orderBy: { key: "desc" } }),
    db.appSetting.findUnique({ where: { id: 1 } }),
    db.user.count({ where: { isActive: true, role: { in: ["ADMIN", "HR", "EMPLOYEE"] }, payrollProfile: null } }),
  ]);
  const selected = periods.find((p) => p.key === query.period) ?? periods[0];
  const slips = selected ? await db.payslip.findMany({ where: { periodId: selected.id }, orderBy: { employee: { name: "asc" } } }) : [];
  return <><AppHeader name={user.name} position={user.position} role={user.role as "ADMIN" | "HR"} /><main id="main-content" className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:py-10">
    <section className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-slate-800">Payroll dan slip gaji</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Buat draft dari absensi sah, periksa setiap slip, lalu terbitkan ke akun pegawai. Slip terbit tidak berubah mengikuti perubahan absensi.</p></div>{user.role === "ADMIN" ? <Link href="/admin/payroll" className="button-secondary">Pengaturan payroll</Link> : null}</section>
    {!settings || missingProfiles ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">{!settings ? "Aturan payroll belum disimpan. " : ""}{missingProfiles ? `${missingProfiles} akun aktif belum memiliki profil gaji dan akan dilewati saat pembuatan draft. ` : ""}Admin dapat melengkapinya melalui pengaturan payroll.</p> : null}
    <section className="surface p-5 sm:p-6"><h2 className="mb-4 text-lg font-bold text-slate-800">Siapkan periode</h2><GeneratePayslipsForm month={businessDate(company?.timezone ?? "Asia/Singapore").slice(0, 7)} /></section>
    <section className="surface overflow-hidden"><div className="grid gap-4 border-b border-slate-200 p-5 sm:p-6"><h2 className="text-lg font-bold text-slate-800">Tinjauan slip</h2><form className="flex flex-wrap items-end gap-3"><label className="grid gap-2 text-sm font-bold text-slate-700">Periode pembayaran<select name="period" defaultValue={selected?.key ?? ""} className="field font-normal" disabled={!periods.length}>{periods.length ? periods.map((p) => <option key={p.id} value={p.key}>{p.key}</option>) : <option value="">Belum ada periode</option>}</select></label><button className="button-secondary" disabled={!periods.length}>Tampilkan</button></form>{selected ? <p className="text-sm leading-6 text-slate-600">{payrollDate(selected.startDate)} – {payrollDate(lastPayrollDate(selected.endDate))}. Gajian {payrollDate(selected.payDate)}. Konversi {selected.minutesPerDay} menit per hari · {selected.timezone}.</p> : null}</div>
      {slips.length ? <div className="divide-y divide-slate-200">{slips.map((slip) => {
        const profile: PayrollProfileSnapshot = JSON.parse(slip.profileSnapshot);
        return <article key={slip.id} className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"><div className="min-w-0"><h3 className="font-bold text-slate-900">{profile.name}</h3><p className="mt-1 text-sm text-slate-600">{slip.paidDays} hari dibayar dari {slip.earnedDays} hari ekuivalen · {Math.floor(slip.totalMinutes / 60)}j {slip.totalMinutes % 60}m sah</p><p className={`mt-2 text-sm font-semibold ${slip.status === "PUBLISHED" ? "text-emerald-700" : "text-amber-800"}`}>{slip.status === "PUBLISHED" ? "Terbit · tersedia bagi pegawai" : "Draft · belum terlihat pegawai"}{slip.excludedCount ? ` · ${slip.excludedCount} sesi tidak dihitung` : ""}</p></div><div className="flex flex-wrap items-center gap-4"><p className="number font-bold text-slate-900">{rupiah(slip.netPay)}</p><Link href={`/payroll/${slip.id}`} className="button-secondary">{slip.status === "PUBLISHED" ? "Lihat slip" : "Tinjau slip"}</Link></div></article>;
      })}</div> : <p className="px-6 py-12 text-center text-sm text-slate-600">Belum ada draft untuk ditinjau. Lengkapi pengaturan dan profil gaji, lalu buat draft periode.</p>}
    </section>
  </main></>;
}
