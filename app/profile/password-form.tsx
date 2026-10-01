"use client";

import { Key } from "@phosphor-icons/react";
import { useActionState } from "react";
import { changePasswordAction, type PasswordState } from "./actions";

const initialState: PasswordState = { ok: false, message: "" };

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);
  return <form action={action} className="grid gap-4">
    <label className="grid gap-2 text-sm font-bold text-slate-700">Password saat ini<input name="currentPassword" type="password" required autoComplete="current-password" className="field font-normal" /></label>
    <label className="grid gap-2 text-sm font-bold text-slate-700">Password baru<input name="newPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field font-normal" /></label>
    <label className="grid gap-2 text-sm font-bold text-slate-700">Ulangi password baru<input name="confirmation" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field font-normal" /></label>
    {state.message ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>{state.message}</p> : null}
    <button className="button-primary" disabled={pending}><Key size={20} aria-hidden="true" />{pending ? "Menyimpan..." : "Ubah password"}</button>
  </form>;
}
