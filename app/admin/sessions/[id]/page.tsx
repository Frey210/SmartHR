import Link from "next/link";
import { ArrowLeft, Clock, MapPin } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { AppHeader } from "@/app/_components/app-header";
import { ConfirmSubmit } from "@/app/_components/confirm-submit";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMinutes } from "@/lib/date";
import { db } from "@/lib/db";
import { deleteEvidenceAction } from "../../actions";

const mapUrl = (latitude: number, longitude: number) => `https://www.google.com/maps?q=${latitude},${longitude}`;

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("ADMIN");
  const { id } = await params;
  const [settings, session] = await Promise.all([
    db.appSetting.findUnique({ where: { id: 1 } }),
    db.attendanceSession.findUnique({ where: { id }, include: { employee: true, location: true, evidences: { where: { deletedAt: null } }, correctionRequests: { orderBy: { createdAt: "desc" } } } }),
  ]);
  if (!session) notFound();
  const timezone = settings?.timezone ?? "Asia/Singapore";

  return <div className="min-h-[100dvh]">
    <AppHeader name={user.name} position={user.position} role="ADMIN" />
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <Link href="/admin/records" className="flex w-fit items-center gap-2 text-sm font-bold text-[#0868D7] hover:underline"><ArrowLeft size={18} aria-hidden="true" />Kembali ke rekap</Link>
      <section className="surface p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold text-[#0868D7]">Detail sesi</p><h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-[#2B3C5A]">{session.employee.name}</h1><p className="mt-2 text-slate-500">{session.employee.position} · {session.location?.name ?? "Lokasi dihapus"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${session.status === "OPEN" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{session.status === "OPEN" ? "Aktif" : "Selesai"}</span></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-3"><div><p className="text-sm text-slate-500">Clock in</p><p className="number mt-1 font-bold">{formatDateTime(session.clockInAt, timezone)}</p></div><div><p className="text-sm text-slate-500">Clock out</p><p className="number mt-1 font-bold">{session.clockOutAt ? formatDateTime(session.clockOutAt, timezone) : "Belum clock out"}</p></div><div><p className="text-sm text-slate-500">Durasi</p><p className="number mt-1 font-bold">{session.durationMinutes == null ? "Berjalan" : formatMinutes(session.durationMinutes)}</p></div></div>
      </section>

      <section className="surface p-5 sm:p-7"><h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Lokasi</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><a href={mapUrl(session.clockInLatitude, session.clockInLongitude)} target="_blank" rel="noreferrer" className="button-secondary"><MapPin size={20} aria-hidden="true" />Buka lokasi clock in</a>{session.clockOutLatitude != null && session.clockOutLongitude != null ? <a href={mapUrl(session.clockOutLatitude, session.clockOutLongitude)} target="_blank" rel="noreferrer" className="button-secondary"><MapPin size={20} aria-hidden="true" />Buka lokasi clock out</a> : null}</div></section>

      <section className="surface overflow-hidden"><div className="border-b border-slate-200 px-5 py-4 sm:px-7"><h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Bukti pekerjaan</h2></div>{session.evidences.length ? <div className="grid gap-px bg-slate-100 sm:grid-cols-2">{session.evidences.map((evidence) => <article key={evidence.id} className="bg-white p-5"><div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
        {/* Endpoint privat membutuhkan cookie browser, sehingga tidak diproses oleh image optimizer server. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/evidence/${evidence.id}`} alt={`Dokumentasi ${session.employee.name}: ${evidence.originalFilename}`} loading="lazy" decoding="async" className="size-full object-contain" />
      </div><p className="mt-4 text-sm leading-6 text-slate-700">{evidence.description}</p><p className="mt-2 truncate text-xs text-slate-500">{evidence.originalFilename} · {(evidence.sizeBytes / 1024).toFixed(0)} KB</p><form action={deleteEvidenceAction} className="mt-4"><input type="hidden" name="evidenceId" value={evidence.id} /><ConfirmSubmit className="button-danger w-full" message={`Hapus foto ${evidence.originalFilename}? Metadata audit tetap disimpan.`}>Hapus foto</ConfirmSubmit></form></article>)}</div> : <p className="px-6 py-12 text-center text-sm text-slate-500">Tidak ada bukti aktif untuk sesi ini.</p>}</section>

      {session.correctionRequests.length ? <section className="surface p-5 sm:p-7"><h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Riwayat permintaan manual</h2><div className="mt-5 grid gap-3">{session.correctionRequests.map((request) => <article key={request.id} className="rounded-xl border border-slate-200 p-4"><p className="flex items-center gap-2 font-bold"><Clock size={18} aria-hidden="true" />{formatDateTime(request.requestedClockOutAt, timezone)} · {request.status}</p><p className="mt-2 text-sm leading-6 text-slate-600">{request.reason}</p></article>)}</div></section> : null}
    </main>
  </div>;
}
