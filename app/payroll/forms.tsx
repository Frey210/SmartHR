"use client";

import { useActionState } from "react";
import { adjustmentLabels, type PayrollAdjustments } from "@/lib/payroll";
import { generatePayslipsAction, savePayrollProfileAction, savePayrollSettingsAction, updatePayslipAction, type PayrollState } from "./actions";

const initial: PayrollState = { ok: false, message: "" };
function Feedback({ state }: { state: PayrollState }) {
  return state.message ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm leading-6 ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>{state.message}</p> : null;
}
function Field({ label, name, value, min = 0, max = 2_147_483_647 }: { label: string; name: string; value: number | string; min?: number; max?: number }) {
  return <label className="grid gap-2 text-sm font-bold text-slate-700">{label}<input name={name} type="number" inputMode="numeric" required min={min} max={max} step={1} defaultValue={value} className="field min-w-0 font-normal" /></label>;
}

export function PayrollSettingsForm({ settings }: { settings: { periodStartDay: number; payday: number; minutesPerDay: number; signerName: string; signerPosition: string; city: string } }) {
  const [state, action, pending] = useActionState(savePayrollSettingsAction, initial);
  return <form action={action} onReset={(e) => e.preventDefault()} className="grid gap-4" aria-label="Aturan payroll">
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Tanggal awal periode" name="periodStartDay" value={settings.periodStartDay} min={1} max={31} />
      <Field label="Tanggal gajian" name="payday" value={settings.payday} min={1} max={31} />
      <Field label="Menit untuk 1 hari" name="minutesPerDay" value={settings.minutesPerDay} min={1} max={1440} />
    </div>
    <p className="text-sm leading-6 text-slate-600">Default 25–24, gajian tanggal 25. Total jam satu periode dikumpulkan; 300 menit = 5 jam = 1 hari penuh. Sisa menit tidak dibawa ke periode berikutnya. Tanggal 29–31 mengikuti hari terakhir jika bulan lebih pendek.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-bold text-slate-700">Nama penanggung jawab<input name="signerName" required maxLength={100} defaultValue={settings.signerName} className="field font-normal" /></label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">Jabatan penanggung jawab<input name="signerPosition" required maxLength={100} defaultValue={settings.signerPosition} className="field font-normal" /></label>
    </div>
    <label className="grid gap-2 text-sm font-bold text-slate-700">Kota penerbitan<input name="city" required maxLength={80} defaultValue={settings.city} className="field font-normal" /></label>
    <Feedback state={state} /><button className="button-primary justify-self-start" disabled={pending}>{pending ? "Menyimpan..." : "Simpan aturan payroll"}</button>
  </form>;
}

export function PayrollProfileForm({ employeeId, profile }: { employeeId: string; profile: { baseSalary: number; communicationAllowance: number; transportRate: number; maxPaidDays: number; nationalId: string; taxStatus: string } | null }) {
  const [state, action, pending] = useActionState(savePayrollProfileAction, initial);
  return <form action={action} onReset={(e) => e.preventDefault()} className="grid gap-4" aria-label="Profil gaji pegawai">
    <input type="hidden" name="employeeId" value={employeeId} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Gaji pokok tetap (Rp)" name="baseSalary" value={profile?.baseSalary ?? ""} />
      <Field label="Tunjangan komunikasi tetap (Rp)" name="communicationAllowance" value={profile?.communicationAllowance ?? ""} />
      <Field label="Tarif transport per hari (Rp)" name="transportRate" value={profile?.transportRate ?? ""} />
      <Field label="Maksimum hari dibayar per periode" name="maxPaidDays" value={profile?.maxPaidDays ?? ""} max={366} />
      <label className="grid gap-2 text-sm font-bold text-slate-700">NIK KTP (opsional)<input name="nationalId" inputMode="numeric" pattern="[0-9]{16}" maxLength={16} defaultValue={profile?.nationalId ?? ""} className="field font-normal" /></label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">Status/tanggungan<input name="taxStatus" required maxLength={30} defaultValue={profile?.taxStatus ?? "TK/0"} placeholder="Contoh: TK/0" className="field font-normal" /></label>
    </div>
    <p className="text-sm leading-6 text-slate-600">Gaji pokok dan komunikasi tetap. Transport = hari dibayar × tarif. Batas hari tidak mengurangi pencatatan jam absensi. Isi 0 jika komponen tidak berlaku.</p>
    <Feedback state={state} /><button className="button-secondary justify-self-start" disabled={pending}>{pending ? "Menyimpan..." : "Simpan profil gaji"}</button>
  </form>;
}

export function GeneratePayslipsForm({ month }: { month: string }) {
  const [state, action, pending] = useActionState(generatePayslipsAction, initial);
  return <form action={action} className="grid gap-3" aria-label="Buat draft slip gaji">
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-2 text-sm font-bold text-slate-700">Bulan pembayaran<input name="period" type="month" required min="2000-01" max="9998-12" defaultValue={month} className="field font-normal" /></label>
      <button className="button-primary" disabled={pending}>{pending ? "Menghitung draft..." : "Buat draft periode"}</button>
    </div>
    <p className="text-sm leading-6 text-slate-600">Hanya akun aktif dengan profil gaji yang dibuatkan draft. Draft tidak terlihat oleh pegawai. Periode yang sudah ada mempertahankan aturan dan tanggal semula.</p>
    <Feedback state={state} />
  </form>;
}

export function PayslipAdjustmentsForm({ id, version, adjustments }: { id: string; version: number; adjustments: PayrollAdjustments }) {
  const [state, action, pending] = useActionState(updatePayslipAction, initial);
  return <form action={action} onReset={(e) => e.preventDefault()} className="grid gap-4" aria-label="Komponen tambahan dan potongan">
    <input type="hidden" name="id" value={id} /><input type="hidden" name="version" value={version} /><input type="hidden" name="operation" value="save" />
    <div className="grid gap-4 sm:grid-cols-2">{Object.entries(adjustmentLabels).map(([name, label]) => <Field key={name} name={name} label={name.endsWith("Days") ? label : `${label} (Rp)`} value={adjustments[name as keyof typeof adjustmentLabels]} />)}</div>
    <p className="text-sm leading-6 text-slate-600">PPh 21 dan data izin/sakit diisi manual sesuai hasil tinjauan; aplikasi belum menghitung pajak atau cuti otomatis.</p>
    <label className="grid gap-2 text-sm font-bold text-slate-700">Catatan slip<textarea name="note" rows={3} maxLength={5000} defaultValue={adjustments.note} className="field min-h-24 resize-y py-3 font-normal" /></label>
    <Feedback state={state} /><button className="button-secondary justify-self-start" disabled={pending}>{pending ? "Menyimpan..." : "Simpan komponen draft"}</button>
  </form>;
}

export function PayslipDecisionForm({ id, version, operation, isAdmin = false }: { id: string; version: number; operation: "refresh" | "publish"; isAdmin?: boolean }) {
  const [state, action, pending] = useActionState(updatePayslipAction, initial);
  return <form action={action} className="grid gap-3" aria-label={operation === "publish" ? "Terbitkan slip gaji" : "Hitung ulang slip gaji"}>
    <input type="hidden" name="id" value={id} /><input type="hidden" name="version" value={version} /><input type="hidden" name="operation" value={operation} />
    {operation === "publish" ? <label className="flex min-h-12 cursor-pointer items-start gap-3 text-sm leading-6 text-slate-700"><input type="checkbox" name="reviewed" required className="mt-1 size-5 shrink-0 accent-blue-600" />Saya sudah meninjau absensi, komponen, dan potongan. Slip yang diterbitkan dapat dilihat pegawai dan tidak dapat diubah.</label> : <p className="text-sm leading-6 text-slate-600">{isAdmin ? "Perbarui absensi dan profil gaji dari pengaturan Admin terbaru. Tanggal periode dan konversi menit tetap; komponen tambahan tidak dihapus." : "Perbarui absensi sah. Profil gaji, aturan periode, dan komponen tambahan tetap dipertahankan."}</p>}
    <Feedback state={state} /><button className={operation === "publish" ? "button-primary" : "button-secondary"} disabled={pending}>{pending ? "Memproses..." : operation === "publish" ? "Setujui & terbitkan" : "Hitung ulang absensi"}</button>
  </form>;
}
