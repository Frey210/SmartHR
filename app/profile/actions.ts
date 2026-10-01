"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export type PasswordState = { ok: boolean; message: string };

export async function changePasswordAction(_: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (!(await verifyPassword(currentPassword, user.passwordHash))) return { ok: false, message: "Password saat ini tidak sesuai." };
  if (newPassword.length < 8 || newPassword.length > 128) return { ok: false, message: "Password baru harus terdiri dari 8-128 karakter." };
  if (newPassword !== confirmation) return { ok: false, message: "Konfirmasi password baru tidak sama." };
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } }),
    db.authSession.deleteMany({ where: { userId: user.id } }),
    db.auditLog.create({ data: { actorId: user.id, action: "PASSWORD_CHANGED", entityType: "User", entityId: user.id } }),
  ]);
  revalidatePath("/profile");
  return { ok: true, message: "Password berhasil diubah. Silakan login kembali." };
}
