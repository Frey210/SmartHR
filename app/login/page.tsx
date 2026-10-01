import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/employee");

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#2B3C5A] px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 top-20 size-[34rem] rounded-full border border-white/10" aria-hidden="true" />
        <div className="absolute -right-12 top-52 size-80 rounded-full bg-[#1A82FF]/15" aria-hidden="true" />
        <Image src="/mtc-logo.jpg" width={112} height={112} alt="Logo PT Media Teknologi Celebes" className="relative rounded-2xl" priority />
        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-blue-200">MTC Attendance</p>
          <h1 className="font-[family-name:var(--font-heading)] text-5xl font-bold leading-[1.08] tracking-[-0.03em]">
            Kehadiran tercatat. Pekerjaan terdokumentasi.
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg leading-8 text-slate-200">
            Satu ruang kerja untuk pencatatan sesi, lokasi, dan dokumentasi tim PT Media Teknologi Celebes.
          </p>
        </div>
        <p className="relative text-sm text-slate-300">PT Media Teknologi Celebes</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Image src="/mtc-logo.jpg" width={72} height={72} alt="Logo MTC" className="mb-8 rounded-xl lg:hidden" priority />
          <p className="text-sm font-bold text-[#0868D7]">Selamat datang</p>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-[-0.02em] text-[#2B3C5A]">
            Masuk ke akun Anda
          </h2>
          <p className="mb-8 mt-3 leading-7 text-slate-600">Gunakan username dan password yang diberikan admin.</p>
          <LoginForm />
          {process.env.NODE_ENV !== "production" ? (
            <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950">
              Development: <strong>admin / Admin123!</strong> atau <strong>fariz / Karyawan123!</strong>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
