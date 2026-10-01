"use client";

import { SlidersHorizontal, UserPlus } from "@phosphor-icons/react";
import { useActionState } from "react";
import { createEmployeeAction, updateTimezoneAction, type AdminFormState } from "./actions";

const initialState: AdminFormState = { ok: false, message: "" };

function Message({ state }: { state: AdminFormState }) {
  return state.message ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>{state.message}</p> : null;
}

export function EmployeeForm() {
  const [state, action, pending] = useActionState(createEmployeeAction, initialState);
  return <form action={action} className="grid gap-4">
    <label className="grid gap-2 text-sm font-bold text-slate-700">Nama lengkap<input name="name" required minLength={2} maxLength={100} className="field font-normal" /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-bold text-slate-700">Username<input name="username" required minLength={3} maxLength={40} pattern="[a-z0-9._-]+" className="field font-normal" /></label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">Posisi<input name="position" required maxLength={80} className="field font-normal" /></label>
    </div>
    <label className="grid gap-2 text-sm font-bold text-slate-700">Password awal<input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field font-normal" /></label>
    <Message state={state} />
    <button className="button-primary" disabled={pending}><UserPlus size={20} aria-hidden="true" />{pending ? "Membuat..." : "Buat akun"}</button>
  </form>;
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
