import Link from "next/link";
import { AppHeader } from "@/app/_components/app-header";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PayrollProfileForm, PayrollSettingsForm } from "@/app/payroll/forms";

export default async function PayrollSettingsPage() {
  const user = await requireUser("ADMIN");
  const [settings, employees] = await Promise.all([
    db.payrollSetting.findUnique({ where: { id: 1 } }),
    db.user.findMany({ where: { isActive: true, role: { in: ["ADMIN", "HR", "EMPLOYEE"] } }, select: { id: true, name: true, position: true, payrollProfile: true }, orderBy: { name: "asc" } }),
  ]);
  return <><AppHeader name={user.name} position={user.position} role="ADMIN" /><main id="main-content" className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:py-10">
    <section><Link href="/payroll" className="inline-flex min-h-11 items-center text-sm font-bold text-blue-700 hover:underline">Kembali ke payroll</Link><h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-slate-800">Pengaturan payroll</h1><p className="mt-2 text-sm leading-6 text-slate-600">Atur periode, konversi jam, serta nominal dan batas hari tiap pegawai. Perubahan berlaku untuk draft baru atau perhitungan ulang oleh Admin.</p></section>
    <section className="surface p-5 sm:p-6"><h2 className="mb-5 text-lg font-bold text-slate-800">Aturan periode dan penanggung jawab</h2><PayrollSettingsForm settings={settings ?? { periodStartDay: 25, payday: 25, minutesPerDay: 300, signerName: "", signerPosition: "", city: "Makassar" }} /></section>
    <section className="surface overflow-hidden"><div className="border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold text-slate-800">Profil gaji pegawai</h2><p className="mt-1 text-sm text-slate-600">{employees.filter((e) => !e.payrollProfile).length} akun aktif belum memiliki profil gaji. Lengkapi secara manual; data Excel tidak diimpor otomatis.</p></div>
      <div className="divide-y divide-slate-200">{employees.map((employee) => <details key={employee.id} className="group px-5 py-4 sm:px-6"><summary className="flex min-h-12 cursor-pointer flex-wrap items-center justify-between gap-2 font-bold text-slate-800"><span>{employee.name}<span className="mt-1 block text-sm font-normal text-slate-600">{employee.position}</span></span><span className={`text-sm ${employee.payrollProfile ? "text-emerald-700" : "text-amber-800"}`}>{employee.payrollProfile ? "Profil tersimpan · Edit" : "Belum diatur · Lengkapi"}</span></summary><div className="mt-5"><PayrollProfileForm employeeId={employee.id} profile={employee.payrollProfile} /></div></details>)}</div>
    </section>
  </main></>;
}
