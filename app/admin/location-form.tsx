"use client";

import { Crosshair, MagnifyingGlass, MapPin, Plus, SpinnerGap } from "@phosphor-icons/react";
import { useActionState, useCallback, useMemo, useState } from "react";
import { LocationMap, type MapLocation } from "@/app/_components/location-map";
import { addLocationAction, type LocationState } from "./actions";

const initialState: LocationState = { ok: false, message: "" };
type PlaceResult = { id: string; label: string; latitude: number; longitude: number };

export function LocationForm({ locations }: { locations: MapLocation[] }) {
  const [state, action, pending] = useActionState(addLocationAction, initialState);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [geoError, setGeoError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const selected = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) && latitude && longitude ? { latitude: lat, longitude: lng } : undefined;
  }, [latitude, longitude]);

  const selectOnMap = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(7));
    setLongitude(lng.toFixed(7));
  }, []);

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

  async function searchPlace() {
    const query = searchQuery.trim();
    if (query.length < 3) return setSearchError("Masukkan minimal 3 karakter untuk mencari lokasi.");
    setSearching(true);
    setSearchError("");
    setSearchResults([]);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.search = new URLSearchParams({ q: query, format: "jsonv2", limit: "5", "accept-language": "id" }).toString();
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Pencarian lokasi gagal");
      const data = await response.json() as { place_id: number; display_name: string; lat: string; lon: string }[];
      const results = data.map((place) => ({
        id: String(place.place_id),
        label: place.display_name,
        latitude: Number(place.lat),
        longitude: Number(place.lon),
      })).filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
      setSearchResults(results);
      if (!results.length) setSearchError("Lokasi tidak ditemukan. Coba nama tempat atau alamat yang lebih lengkap.");
    } catch {
      setSearchError("Pencarian lokasi belum tersedia. Coba lagi atau pilih titik langsung pada peta.");
    } finally {
      setSearching(false);
    }
  }

  function selectPlace(place: PlaceResult) {
    setLatitude(place.latitude.toFixed(7));
    setLongitude(place.longitude.toFixed(7));
    setSearchQuery(place.label);
    setSearchResults([]);
  }

  return (
    <form action={action} className="grid gap-4" aria-busy={pending}>
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-bold text-slate-700">Nama lokasi</label>
        <input id="name" name="name" className="field" placeholder="Contoh: Kantor Utama" required minLength={2} maxLength={80} />
      </div>

      <div className="grid gap-2">
        <label htmlFor="place-search" className="text-sm font-bold text-slate-700">Cari alamat atau tempat</label>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            id="place-search"
            type="search"
            className="field min-w-0"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              void searchPlace();
            }}
            placeholder="Contoh: MTC Manado"
            aria-describedby="place-search-help place-search-status"
          />
          <button type="button" className="button-secondary min-w-12 px-3" onClick={() => void searchPlace()} disabled={searching} aria-label="Cari lokasi">
            {searching ? <SpinnerGap size={20} className="animate-spin" aria-hidden="true" /> : <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />}
            <span className="hidden sm:inline">{searching ? "Mencari..." : "Cari"}</span>
          </button>
        </div>
        <p id="place-search-help" className="text-xs leading-5 text-slate-500">Cari lalu pilih hasil untuk mengarahkan titik pada peta.</p>
        <div id="place-search-status" aria-live="polite">
          {searchResults.length ? <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {searchResults.map((place) => <button
              key={place.id}
              type="button"
              onClick={() => selectPlace(place)}
              className="flex min-h-12 w-full cursor-pointer items-start gap-2 border-b border-slate-100 px-3 py-3 text-left text-sm leading-5 text-slate-700 transition-colors last:border-b-0 hover:bg-blue-50 focus-visible:bg-blue-50"
            >
              <MapPin size={18} className="mt-0.5 shrink-0 text-[#0868D7]" aria-hidden="true" />
              <span>{place.label}</span>
            </button>)}
          </div> : null}
          {searchError ? <p className="text-sm font-medium text-amber-800" role="status">{searchError}</p> : null}
        </div>
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

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <LocationMap locations={locations} selected={selected} onSelect={selectOnMap} label="Pilih titik lokasi absensi" />
        <p className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">Klik peta untuk memilih titik. Lingkaran hijau menunjukkan radius 50 meter lokasi baru.</p>
      </div>

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
