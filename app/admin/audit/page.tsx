import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { AppHeader } from "@/app/_components/app-header";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/date";
import { db } from "@/lib/db";

const labels: Record<string, string> = {
  LOGIN_FAILED: "Login gagal",
  EMPLOYEE_CREATED: "Akun dibuat",
  EMPLOYEE_PASSWORD_RESET: "Password direset",
  EMPLOYEE_DEACTIVATED: "Akun dinonaktifkan",
  EMPLOYEE_ACTIVATED: "Akun diaktifkan",
  PASSWORD_CHANGED: "Password diubah",
  ATTENDANCE_CLOCK_IN: "Clock in",
  ATTENDANCE_CLOCK_OUT: "Clock out",
  CLOCK_OUT_REQUESTED: "Clock out manual diajukan",
  CLOCK_OUT_REQUEST_APPROVED: "Clock out manual disetujui",
  CLOCK_OUT_REQUEST_REJECTED: "Clock out manual ditolak",
  LOCATION_CREATED: "Lokasi dibuat",
  LOCATION_ACTIVATED: "Lokasi diaktifkan",
  LOCATION_DEACTIVATED: "Lokasi dinonaktifkan",
  TIMEZONE_UPDATED: "Zona waktu diubah",
  EVIDENCE_DELETED: "Foto bukti dihapus",
};

export default async function AuditPage() {
  const admin = await requireUser("ADMIN");
  const [settings, logs] = await Promise.all([
    db.appSetting.findUnique({ where: { id: 1 } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const actors = await db.user.findMany({ where: { id: { in: logs.flatMap((log) => log.actorId ? [log.actorId] : []) } }, select: { id: true, name: true } });
  const actorNames = new Map(actors.map((actor) => [actor.id, actor.name]));
  const timezone = settings?.timezone ?? "Asia/Singapore";

  return <div className="min-h-[100dvh]">
    <AppHeader name={admin.name} position={admin.position} role="ADMIN" />
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section><p className="text-sm font-bold text-[#0868D7]">Keamanan dan perubahan data</p><h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-[#2B3C5A]">Audit log</h1><p className="mt-2 text-sm text-slate-500">Menampilkan 100 aktivitas terbaru.</p></section>
      <section className="surface overflow-hidden">{logs.length ? <div className="divide-y divide-slate-100">{logs.map((log) => <article key={log.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-6"><span className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-[#0868D7]"><ShieldCheck size={20} aria-hidden="true" /></span><div><p className="font-bold text-slate-900">{labels[log.action] ?? log.action}</p><p className="mt-1 text-sm text-slate-500">{log.actorId ? actorNames.get(log.actorId) ?? "Pengguna lama" : "Sistem/tanpa sesi"} · {log.entityType}{log.entityId ? ` · ${log.entityId}` : ""}</p></div><time className="number text-sm text-slate-500">{formatDateTime(log.createdAt, timezone)}</time></article>)}</div> : <p className="px-6 py-14 text-center text-sm text-slate-500">Belum ada aktivitas audit.</p>}</section>
    </main>
  </div>;
}
