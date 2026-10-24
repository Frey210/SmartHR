import { AppHeader } from "@/app/_components/app-header";
import { AttendanceApprovals } from "@/app/_components/attendance-approvals";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function HrPage() {
  const user = await requireUser(["HR", "ADMIN"]);
  const settings = await db.appSetting.findUnique({ where: { id: 1 } });
  const timezone = settings?.timezone ?? "Asia/Singapore";
  return <div className="min-h-[100dvh]">
    <AppHeader name={user.name} position={user.position} role={user.role as "ADMIN" | "HR"} />
    <main id="main-content" className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <section>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#2B3C5A] sm:text-3xl">Verifikasi absensi</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Tinjau koreksi lupa clock in dan clock out. Durasi kerja masuk rekap setelah disetujui. Waktu ditampilkan dalam zona {timezone}.</p>
      </section>
      <AttendanceApprovals timezone={timezone} />
    </main>
  </div>;
}
