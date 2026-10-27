"use client";

import { PencilSimple, SlidersHorizontal, Trash, UserPlus } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { ConfirmSubmit } from "@/app/_components/confirm-submit";
import { createEmployeeAction, deleteEmployeeAction, updateEmployeeAction, updateTimezoneAction, updateCorrectionLimitAction, type AdminFormState } from "./actions";

const initialState: AdminFormState = { ok: false, message: "" };

function Message({ state }: { state: AdminFormState }) {
  return state.message ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>{state.message}</p> : null;
}

export function EmployeeForm() {
  const [state, action, pending] = useActionState(createEmployeeAction, initialState);
  return <form action={action} className="grid gap-4">
    <label className="grid gap-2 text-sm font-bold text-slate-700">Role<select name="role" defaultValue="EMPLOYEE" className="field font-normal"><option value="EMPLOYEE">Pegawai</option><option value="HR">HR — verifikasi koreksi absensi</option></select></label>
    <label className="grid gap-2 text-sm font-bold text-slate-700">Nama lengkap<input name="name" required minLength={2} maxLength={100} className="field font-normal" /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-bold text-slate-700">Username<input name="username" required minLength={3} maxLength={40} pattern="[A-Za-z0-9._-]+" title="Gunakan huruf, angka, titik, garis bawah, atau tanda hubung." autoCapitalize="none" className="field font-normal" /></label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">Posisi<input name="position" required maxLength={80} className="field font-normal" /></label>
    </div>
    <label className="grid gap-2 text-sm font-bold text-slate-700">Password awal<input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field font-normal" /></label>
    <Message state={state} />
    <button className="button-primary" disabled={pending}><UserPlus size={20} aria-hidden="true" />{pending ? "Membuat..." : "Buat akun"}</button>
  </form>;
}

export function EmployeeEditor({ employee }: { employee: { id: string; name: string; username: string; position: string; role: string } }) {
  const [editState, editAction, editing] = useActionState(updateEmployeeAction, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteEmployeeAction, initialState);
  return <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-lg font-bold text-[#0868D7] transition-colors hover:bg-blue-50">
      <PencilSimple size={18} aria-hidden="true" /> Edit akun
    </summary>
    <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3">
      <form action={editAction} className="grid gap-3">
        <input type="hidden" name="userId" value={employee.id} />
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">Role<select name="role" defaultValue={employee.role} className="field font-normal"><option value="EMPLOYEE">Pegawai</option><option value="HR">HR — verifikasi koreksi absensi</option></select></label>
        <p className="text-xs leading-5 text-slate-500">Perubahan role mengakhiri sesi login akun ini.</p>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">Nama<input name="name" required minLength={2} maxLength={100} defaultValue={employee.name} className="field font-normal" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">Username<input name="username" required minLength={3} maxLength={40} pattern="[A-Za-z0-9._-]+" title="Gunakan huruf, angka, titik, garis bawah, atau tanda hubung." autoCapitalize="none" defaultValue={employee.username} className="field font-normal" /></label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">Posisi<input name="position" required maxLength={80} defaultValue={employee.position} className="field font-normal" /></label>
        </div>
        <Message state={editState} />
        <button className="button-primary" disabled={editing}>{editing ? "Menyimpan..." : "Simpan perubahan"}</button>
      </form>
      <form action={deleteAction} className="grid gap-2 border-t border-slate-200 pt-3">
        <input type="hidden" name="userId" value={employee.id} />
        <p className="text-xs leading-5 text-slate-500">Akun login dihapus, tetapi riwayat absensi tetap tersimpan untuk laporan.</p>
        <Message state={deleteState} />
        <ConfirmSubmit className="button-danger" disabled={deleting} message={`Hapus akun ${employee.name}? Riwayat absensi tetap tersimpan.`}>
          <Trash size={18} aria-hidden="true" /> {deleting ? "Menghapus..." : "Hapus akun"}
        </ConfirmSubmit>
      </form>
    </div>
  </details>;
}

export function TimezoneForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState(updateTimezoneAction, initialState);
  return <form action={action} className="grid gap-4">
    <label className="grid gap-2 text-sm font-bold text-slate-700">Zona waktu IANA<input name="timezone" required defaultValue={current} className="field font-normal" placeholder="Asia/Singapore" /></label>
    <p className="text-sm leading-6 text-slate-500">Contoh: Asia/Singapore, Asia/Makassar, atau Asia/Jakarta.</p>
    <Message state={state} />
    <button className="button-secondary" disabled={pending}><SlidersHorizontal size={20} aria-hidden="true" />{pending ? "Menyimpan..." : "Simpan zona waktu"}</button>
  </form>;
}

export function CorrectionLimitForm({ current }: { current: number | null }) {
  const [state, action, pending] = useActionState(updateCorrectionLimitAction, initialState);
  const [enabled, setEnabled] = useState(current !== null);
  return <form action={action} onReset={(event) => event.preventDefault()} className="grid gap-4" aria-label="Pengaturan batas pengajuan koreksi">
    <label className="flex min-h-12 cursor-pointer items-center gap-3 text-sm font-bold text-slate-700">
      <input name="limitEnabled" type="checkbox" checked={enabled} disabled={pending} onChange={(event) => setEnabled(event.target.checked)} className="size-5 shrink-0 accent-blue-600 disabled:cursor-not-allowed" />
      Batasi waktu pengajuan
    </label>
    <label htmlFor="correction-limit-days" className="grid gap-2 text-sm font-bold text-slate-700">
      Maksimal hari setelah tanggal clock in
      <input id="correction-limit-days" name="correctionLimitDays" type="number" inputMode="numeric" min={1} max={2_147_483_647} step={1} required={enabled} disabled={!enabled || pending} defaultValue={current ?? 3} aria-describedby="correction-limit-help correction-limit-result" aria-invalid={Boolean(state.message && !state.ok)} className="field font-normal disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
    </label>
    <div id="correction-limit-help" className="grid gap-2 text-sm leading-6 text-slate-600">
      <p>{enabled ? "Dihitung per hari kalender dalam zona waktu perusahaan. Batas 1 hari: absensi kemarin masih dapat diajukan sampai akhir hari ini." : "Nonaktif: pegawai dapat mengajukan koreksi tanpa batas usia absensi."}</p>
      <p>Berlaku untuk lupa clock in dan clock out. Pengajuan yang sudah terkirim tetap dapat ditinjau Admin/HR.</p>
    </div>
    <div id="correction-limit-result"><Message state={state} /></div>
    <button className="button-secondary" disabled={pending}>{pending ? "Menyimpan..." : "Simpan batas pengajuan"}</button>
  </form>;
}
