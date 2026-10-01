"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";
import { clearLoginFailures, loginRetryAfter, recordLoginFailure } from "@/lib/login-rate-limit";

export type LoginState = { error: string };

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) return { error: "Username dan password wajib diisi." };

  const requestHeaders = await headers();
  const clientIp = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  const rateKey = `${username}|${clientIp}`;
  const retryAfter = loginRetryAfter(rateKey);
  if (retryAfter) return { error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(retryAfter / 60)} menit.` };

  const user = await db.user.findUnique({ where: { username } });
  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    recordLoginFailure(rateKey);
    await writeAudit(user?.id ?? null, "LOGIN_FAILED", "User", user?.id, { username });
    return { error: "Username atau password tidak sesuai." };
  }

  clearLoginFailures(rateKey);
  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : "/employee");
}
