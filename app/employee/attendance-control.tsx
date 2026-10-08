"use client";

import { Camera, Crosshair, MapPin, SpinnerGap, Trash, UploadSimple } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type Dispatch, type FormEvent, type SetStateAction, useEffect, useRef, useState, useTransition } from "react";
import { imageExtension } from "@/lib/image";
import { clockInAction, clockOutAction, requestAttendanceCorrectionAction, type AttendanceActionResult } from "./actions";

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Gagal mengompres foto")), "image/webp", 0.72));
  if (blob.type !== "image/webp") {
    blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Gagal mengompres foto")), "image/jpeg", 0.8));
  }
  const extension = imageExtension(blob.type);
  if (!extension) throw new Error("Format hasil kompresi tidak didukung");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + `.${extension}`, { type: blob.type });
}

type EvidenceDraft = { id: string; file: File; previewUrl: string; description: string };

function EvidencePicker({ items, setItems }: { items: EvidenceDraft[]; setItems: Dispatch<SetStateAction<EvidenceDraft[]>> }) {
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)), []);
  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.currentTarget.files ?? [])];
    setItems((current) => [...current, ...files.map((file) => ({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file), description: "" }))]);
    event.currentTarget.value = "";
  }
  function remove(id: string) {
    setItems((current) => current.filter((item) => {
      if (item.id === id) URL.revokeObjectURL(item.previewUrl);
      return item.id !== id;
    }));
  }
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-bold text-slate-700">Dokumentasi pekerjaan</legend>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition-colors hover:border-slate-500 hover:bg-slate-50">
          <Camera size={20} aria-hidden="true" /> Kamera
          <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={addFiles} className="sr-only" />
        </label>
        <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition-colors hover:border-slate-500 hover:bg-slate-50">
          <UploadSimple size={20} aria-hidden="true" /> Galeri / file
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addFiles} className="sr-only" />
        </label>
      </div>
      <p className="text-xs leading-5 text-slate-500">Setiap foto memiliki deskripsi sendiri. Tambahkan minimal satu foto.</p>
      {items.length ? <div className="grid gap-3">
        {items.map((item, index) => <article key={item.id} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[88px_1fr]">
          <Image src={item.previewUrl} alt={`Pratinjau foto ${index + 1}`} width={88} height={88} unoptimized className="size-[88px] rounded-lg object-cover" />
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">Foto {index + 1}</p>
                <p className="truncate text-xs text-slate-500">{item.file.name}</p>
              </div>
              <button type="button" onClick={() => remove(item.id)} className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700" aria-label={`Hapus foto ${index + 1}`}>
                <Trash size={20} aria-hidden="true" />
              </button>
            </div>
            <label className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
              Deskripsi foto {index + 1}
              <textarea required rows={2} value={item.description} onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, description: event.target.value } : entry))} className="field min-h-20 resize-y py-2 font-normal text-slate-900" placeholder="Jelaskan pekerjaan pada foto ini..." />
            </label>
          </div>
        </article>)}
      </div> : null}
    </fieldset>
  );
}

function evidenceError(items: EvidenceDraft[]) {
  if (!items.length) return "Tambahkan minimal satu foto dari kamera atau galeri.";
  if (items.some((item) => !item.description.trim())) return "Isi deskripsi untuk setiap foto dokumentasi.";
  return null;
}

async function appendEvidence(payload: FormData, items: EvidenceDraft[]) {
  for (const item of items) {
    payload.append("evidence", await compressImage(item.file));
    payload.append("evidenceDescription", item.description.trim());
  }
}

export function AttendanceControl({ hasOpenSession, hasLocations }: { hasOpenSession: boolean; hasLocations: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AttendanceActionResult | null>(null);
  const [evidence, setEvidence] = useState<EvidenceDraft[]>([]);

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
          if (response.ok) router.refresh();
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
    const validationError = evidenceError(evidence);
    if (validationError) return setResult({ ok: false, message: validationError });
    if (!navigator.geolocation) return setResult({ ok: false, message: "Browser ini tidak mendukung akses lokasi." });
    navigator.geolocation.getCurrentPosition(
      (position) => startTransition(async () => {
        try {
          const payload = new FormData();
          payload.set("latitude", String(position.coords.latitude));
          payload.set("longitude", String(position.coords.longitude));
          payload.set("accuracyM", String(position.coords.accuracy));
          await appendEvidence(payload, evidence);
          const response = await clockOutAction(payload);
          setResult(response);
          if (response.ok) {
            evidence.forEach((item) => URL.revokeObjectURL(item.previewUrl));
            setEvidence([]);
            router.refresh();
          }
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
        {pending ? "Membaca lokasi..." : hasOpenSession ? "Sesi sedang aktif" : "Konfirmasi clock in"}
      </button> : <form onSubmit={clockOut} className="grid gap-4">
        <EvidencePicker items={evidence} setItems={setEvidence} />
        <button type="submit" className="button-primary min-h-14 w-full text-base" disabled={pending}>
          {pending ? <SpinnerGap size={22} className="animate-spin" aria-hidden="true" /> : null}
          {pending ? "Memproses dokumentasi..." : "Konfirmasi clock out"}
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

export function AttendanceCorrectionRequest({ defaultStartTime, defaultEndTime, sessions }: { defaultStartTime: string; defaultEndTime: string; sessions: { id: string; label: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AttendanceActionResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [requestType, setRequestType] = useState(sessions.length ? "CLOCK_OUT" : "MISSING_SESSION");
  const [evidence, setEvidence] = useState<EvidenceDraft[]>([]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const source = new FormData(form);
    const validationError = evidenceError(evidence);
    if (validationError) return setResult({ ok: false, message: validationError });
    startTransition(async () => {
      try {
        const payload = new FormData();
        payload.set("requestType", requestType);
        if (requestType === "CLOCK_OUT") payload.set("attendanceSessionId", String(source.get("attendanceSessionId") ?? ""));
        if (requestType === "MISSING_SESSION") payload.set("requestedClockInAt", new Date(String(source.get("requestedClockInAt") ?? "")).toISOString());
        payload.set("requestedClockOutAt", new Date(String(source.get("requestedClockOutAt") ?? "")).toISOString());
        payload.set("reason", String(source.get("reason") ?? ""));
        await appendEvidence(payload, evidence);
        const response = await requestAttendanceCorrectionAction(payload);
        setResult(response);
        if (response.ok) {
          evidence.forEach((item) => URL.revokeObjectURL(item.previewUrl));
          setEvidence([]);
          formRef.current?.reset();
        }
      } catch {
        setResult({ ok: false, message: "Foto gagal diproses. Coba gunakan foto lain." });
      }
    });
  }

  return <form ref={formRef} onSubmit={submit} className="grid gap-4">
    <fieldset className="grid grid-cols-2 gap-2">
      <legend className="mb-2 text-sm font-bold text-slate-700">Jenis koreksi</legend>
      <button type="button" onClick={() => setRequestType("CLOCK_OUT")} disabled={!sessions.length} aria-pressed={requestType === "CLOCK_OUT"} className={`min-h-12 cursor-pointer rounded-[10px] border px-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${requestType === "CLOCK_OUT" ? "border-[#1A82FF] bg-blue-50 text-[#0868D7]" : "border-slate-300 bg-white text-slate-600"}`}>Lupa clock out</button>
      <button type="button" onClick={() => setRequestType("MISSING_SESSION")} aria-pressed={requestType === "MISSING_SESSION"} className={`min-h-12 cursor-pointer rounded-[10px] border px-3 text-sm font-bold transition-colors ${requestType === "MISSING_SESSION" ? "border-[#1A82FF] bg-blue-50 text-[#0868D7]" : "border-slate-300 bg-white text-slate-600"}`}>Lupa clock in</button>
    </fieldset>
    {requestType === "CLOCK_OUT" ? <label className="grid gap-2 text-sm font-bold text-slate-700">Sesi yang belum selesai
      <select name="attendanceSessionId" required className="field">
        {sessions.map((session) => <option key={session.id} value={session.id}>{session.label}</option>)}
      </select>
    </label> : <label className="grid gap-2 text-sm font-bold text-slate-700">Waktu clock in
      <input name="requestedClockInAt" type="datetime-local" required defaultValue={defaultStartTime} className="field" />
    </label>}
    <label className="grid gap-2 text-sm font-bold text-slate-700">Waktu clock out
      <input name="requestedClockOutAt" type="datetime-local" required defaultValue={defaultEndTime} className="field" />
    </label>
    <label className="grid gap-2 text-sm font-bold text-slate-700">Alasan
      <textarea name="reason" required rows={3} className="field min-h-24 resize-y py-3 font-normal" placeholder="Jelaskan mengapa absensi tidak tercatat..." />
    </label>
    <EvidencePicker items={evidence} setItems={setEvidence} />
    <button className="button-secondary" disabled={pending}>{pending ? "Mengirim..." : "Ajukan ke admin"}</button>
    {result ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>{result.message}</p> : null}
  </form>;
}
