import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { roleHome, type UserRole } from "@/lib/roles";
import { expireAttendanceSessions } from "@/lib/attendance-cutoff";

const COOKIE_NAME = "mtc_session";
const SESSION_DAYS = 7;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.authSession.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.SESSION_COOKIE_SECURE === "true",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await db.authSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date() || !session.user.isActive) return null;
  const settings = await db.appSetting.findUnique({ where: { id: 1 } });
  await expireAttendanceSessions(settings?.timezone ?? "Asia/Singapore");
  return session.user;
}

export async function requireUser(role?: UserRole | UserRole[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role && !(Array.isArray(role) ? role : [role]).includes(user.role as UserRole)) redirect(roleHome(user.role));
  return user;
}
