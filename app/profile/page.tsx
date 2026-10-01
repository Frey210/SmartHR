import { AppHeader } from "@/app/_components/app-header";
import { requireUser } from "@/lib/auth";
import { PasswordForm } from "./password-form";

export default async function ProfilePage() {
  const user = await requireUser();
  return <div className="min-h-[100dvh]">
    <AppHeader name={user.name} position={user.position} role={user.role as "ADMIN" | "EMPLOYEE"} />
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 lg:py-12">
      <section className="surface p-5 sm:p-7">
        <p className="text-sm font-bold text-[#0868D7]">Keamanan akun</p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-[#2B3C5A]">Ubah password</h1>
        <p className="mb-7 mt-2 text-sm leading-6 text-slate-500">Setelah password diubah, semua sesi login akan dihentikan.</p>
        <PasswordForm />
      </section>
    </main>
  </div>;
}
