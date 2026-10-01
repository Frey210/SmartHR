"use client";

import { Camera, Crosshair, MapPin, SpinnerGap } from "@phosphor-icons/react";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { clockInAction, clockOutAction, requestManualClockOutAction, type AttendanceActionResult } from "./actions";

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Gagal mengompres foto")), "image/webp", 0.72));
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}

export function AttendanceControl({ hasOpenSession, hasLocations }: { hasOpenSession: boolean; hasLocations: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AttendanceActionResult | null>(null);

  function clockIn() {
    setResult(null);
    if (!navigator.geolocation) {
      setResult({ ok: false, message: "Browser ini tidak mendukung akses lokasi." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          const response = await clockInAction({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyM: position.coords.accuracy,
          });
          setResult(response);
          if (response.ok) window.location.reload();
        });
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? "Izin lokasi ditolak. Aktifkan izin lokasi Chrome lalu coba lagi."
          : "Lokasi belum dapat dibaca. Periksa GPS dan koneksi lalu coba lagi.";
        setResult({ ok: false, message });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  function clockOut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const form = event.currentTarget;
    if (!navigator.geolocation) return setResult({ ok: false, message: "Browser ini tidak mendukung akses lokasi." });
    navigator.geolocation.getCurrentPosition(
      (position) => startTransition(async () => {
        try {
          const source = new FormData(form);
          const files = source.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
          const payload = new FormData();
          payload.set("description", String(source.get("description") ?? ""));
          payload.set("latitude", String(position.coords.latitude));
          payload.set("longitude", String(position.coords.longitude));
          payload.set("accuracyM", String(position.coords.accuracy));
          for (const file of files) payload.append("evidence", await compressImage(file));
          const response = await clockOutAction(payload);
          setResult(response);
          if (response.ok) window.location.reload();
        } catch {
          setResult({ ok: false, message: "Foto gagal diproses. Coba gunakan foto lain." });
        }
      }),
      () => setResult({ ok: false, message: "Lokasi belum dapat dibaca. Aktifkan GPS lalu coba lagi." }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return (
    <div className="grid gap-4">
      {!hasOpenSession ? <button
        type="button"
        onClick={clockIn}
        className="button-primary min-h-14 w-full text-base"
        disabled={pending || hasOpenSession || !hasLocations}
      >
        {pending ? <SpinnerGap size={22} className="animate-spin" aria-hidden="true" /> : <Crosshair size={22} weight="bold" aria-hidden="true" />}
        {pending ? "Membaca lokasi..." : hasOpenSession ? "Sesi sedang aktif" : "Clock In"}
      </button> : <form onSubmit={clockOut} className="grid gap-4">
        <label className="grid gap-2 text-sm font-bold text-white">
          Deskripsi pekerjaan
          <textarea name="description" required rows={4} className="field min-h-28 resize-y py-3 font-normal text-slate-900" placeholder="Jelaskan pekerjaan yang diselesaikan..." />
        </label>
        <label className="grid gap-2 text-sm font-bold text-white">
          Foto dokumentasi
          <span className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-white/30 bg-white/10 px-4 text-white hover:bg-white/15">
            <Camera size={20} aria-hidden="true" /> Pilih foto
            <input name="evidence" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple required className="sr-only" />
          </span>
        </label>
        <button type="submit" className="button-primary min-h-14 w-full text-base" disabled={pending}>
          {pending ? <SpinnerGap size={22} className="animate-spin" aria-hidden="true" /> : null}
          {pending ? "Memproses dokumentasi..." : "Clock Out"}
        </button>
      </form>}

      {!hasLocations ? (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <MapPin size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
          Admin belum menambahkan lokasi absensi aktif.
        </p>
      ) : null}

      {result ? (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm font-medium leading-6 ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}
        >
          {result.message}
        </p>
      ) : null}
    </div>
  );
}

export function ManualClockOutRequest({ defaultTime }: { defaultTime: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AttendanceActionResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const source = new FormData(form);
    const localTime = String(source.get("localTime") ?? "");
    startTransition(async () => {
      try {
        const payload = new FormData();
        payload.set("requestedClockOutAt", new Date(localTime).toISOString());
        payload.set("reason", String(source.get("reason") ?? ""));
        payload.set("description", String(source.get("description") ?? ""));
        const files = source.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
        for (const file of files) payload.append("evidence", await compressImage(file));
        const response = await requestManualClockOutAction(payload);
        setResult(response);
        if (response.ok) formRef.current?.reset();
      } catch {
        setResult({ ok: false, message: "Foto gagal diproses. Coba gunakan foto lain." });
      }
    });
  }

  return <form ref={formRef} onSubmit={submit} className="grid gap-4">
    <label className="grid gap-2 text-sm font-bold text-slate-700">Waktu clock out
      <input name="localTime" type="datetime-local" required defaultValue={defaultTime} className="field" />
    </label>
    <label className="grid gap-2 text-sm font-bold text-slate-700">Alasan
      <textarea name="reason" required rows={3} className="field min-h-24 resize-y py-3 font-normal" placeholder="Jelaskan mengapa clock out tidak tercatat..." />
    </label>
    <label className="grid gap-2 text-sm font-bold text-slate-700">Deskripsi pekerjaan
      <textarea name="description" required rows={3} className="field min-h-24 resize-y py-3 font-normal" placeholder="Jelaskan pekerjaan yang diselesaikan..." />
    </label>
    <label className="grid gap-2 text-sm font-bold text-slate-700">Foto dokumentasi
      <span className="button-secondary cursor-pointer"><Camera size={20} aria-hidden="true" />Pilih foto<input name="evidence" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple required className="sr-only" /></span>
    </label>
    <button className="button-secondary" disabled={pending}>{pending ? "Mengirim..." : "Ajukan ke admin"}</button>
    {result ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>{result.message}</p> : null}
  </form>;
}
