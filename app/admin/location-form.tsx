"use client";

import { Crosshair, MapPin, Plus } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { addLocationAction, type LocationState } from "./actions";

const initialState: LocationState = { ok: false, message: "" };

export function LocationForm() {
  const [state, action, pending] = useActionState(addLocationAction, initialState);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [geoError, setGeoError] = useState("");

  function useCurrentLocation() {
    setGeoError("");
    if (!navigator.geolocation) return setGeoError("Browser tidak mendukung akses lokasi.");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(coords.latitude.toFixed(7));
        setLongitude(coords.longitude.toFixed(7));
      },
      () => setGeoError("Lokasi tidak dapat dibaca. Izinkan akses lokasi lalu coba lagi."),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return (
    <form action={action} className="grid gap-4" aria-busy={pending}>
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-bold text-slate-700">Nama lokasi</label>
        <input id="name" name="name" className="field" placeholder="Contoh: Kantor Utama" required minLength={2} maxLength={80} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="latitude" className="text-sm font-bold text-slate-700">Latitude</label>
          <input id="latitude" name="latitude" type="number" step="any" className="field number" value={latitude} onChange={(event) => setLatitude(event.target.value)} required />
        </div>
        <div className="grid gap-2">
          <label htmlFor="longitude" className="text-sm font-bold text-slate-700">Longitude</label>
          <input id="longitude" name="longitude" type="number" step="any" className="field number" value={longitude} onChange={(event) => setLongitude(event.target.value)} required />
        </div>
      </div>

      <button type="button" className="button-secondary w-full" onClick={useCurrentLocation}>
        <Crosshair size={20} weight="bold" aria-hidden="true" /> Gunakan lokasi perangkat
      </button>

      {geoError ? <p className="text-sm font-medium text-red-700" role="alert">{geoError}</p> : null}
      {state.message ? (
        <p className={`rounded-xl border px-4 py-3 text-sm font-medium ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`} role="status">
          {state.message}
        </p>
      ) : null}

      <p className="flex items-center gap-2 text-sm text-slate-500">
        <MapPin size={18} aria-hidden="true" /> Radius absensi ditetapkan maksimal 50 meter.
      </p>
      <button type="submit" className="button-primary w-full" disabled={pending}>
        <Plus size={20} weight="bold" aria-hidden="true" /> {pending ? "Menyimpan..." : "Tambah lokasi"}
      </button>
    </form>
  );
}
