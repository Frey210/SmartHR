"use client";

import { Eye, EyeSlash, SignIn } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: "" };

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="grid gap-5" aria-busy={pending}>
      <div className="grid gap-2">
        <label htmlFor="username" className="text-sm font-bold text-slate-700">
          Username
        </label>
        <input id="username" name="username" className="field" autoComplete="username" required />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-bold text-slate-700">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            className="field pr-12"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-1 top-1 inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeSlash size={21} aria-hidden="true" /> : <Eye size={21} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {state.error ? (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="button-primary w-full" disabled={pending}>
        <SignIn size={21} weight="bold" aria-hidden="true" />
        {pending ? "Memeriksa akun..." : "Masuk"}
      </button>
    </form>
  );
}
