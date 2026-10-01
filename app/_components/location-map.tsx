"use client";

import { Crosshair, MapPin, SpinnerGap } from "@phosphor-icons/react";
import type { FeatureGroup, LeafletMouseEvent, Map as LeafletMap } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { distanceMeters } from "@/lib/geo";

export type MapLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  isActive?: boolean;
};

type Position = { latitude: number; longitude: number; accuracyM?: number };

export function LocationMap({
  locations,
  selected,
  position,
  onSelect,
  label = "Peta lokasi absensi",
}: {
  locations: MapLocation[];
  selected?: Position;
  position?: Position;
  onSelect?: (latitude: number, longitude: number) => void;
  label?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<FeatureGroup | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function mount() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([1.4748, 124.8421], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      const layers = L.featureGroup().addTo(map);
      mapRef.current = map;
      layerRef.current = layers;
      setReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    }
    void mount();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onSelect) return;
    const handler = (event: LeafletMouseEvent) => onSelect(event.latlng.lat, event.latlng.lng);
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [onSelect, ready]);

  useEffect(() => {
    let cancelled = false;
    async function draw() {
      const map = mapRef.current;
      const layers = layerRef.current;
      if (!map || !layers) return;
      const L = await import("leaflet");
      if (cancelled) return;
      layers.clearLayers();
      const points: [number, number][] = [];

      for (const location of locations) {
        const point: [number, number] = [location.latitude, location.longitude];
        const active = location.isActive !== false;
        L.circle(point, {
          radius: Math.min(location.radiusM, 50),
          color: active ? "#1a82ff" : "#64748b",
          fillColor: active ? "#1a82ff" : "#94a3b8",
          fillOpacity: active ? 0.16 : 0.08,
          weight: 2,
        }).bindTooltip(`${location.name} · radius ${Math.min(location.radiusM, 50)} m`).addTo(layers);
        L.circleMarker(point, { radius: 6, color: "#fff", fillColor: active ? "#0868d7" : "#64748b", fillOpacity: 1, weight: 2 }).addTo(layers);
        points.push(point);
      }

      if (selected) {
        const point: [number, number] = [selected.latitude, selected.longitude];
        L.circle(point, { radius: 50, color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 0.16, weight: 2, dashArray: "6 6" })
          .bindTooltip("Lokasi baru · radius 50 m")
          .addTo(layers);
        L.circleMarker(point, { radius: 7, color: "#fff", fillColor: "#0f766e", fillOpacity: 1, weight: 2 }).addTo(layers);
        points.push(point);
      }

      if (position) {
        const point: [number, number] = [position.latitude, position.longitude];
        if (position.accuracyM) L.circle(point, { radius: position.accuracyM, color: "#7c3aed", fillColor: "#8b5cf6", fillOpacity: 0.1, weight: 1 }).addTo(layers);
        L.circleMarker(point, { radius: 7, color: "#fff", fillColor: "#7c3aed", fillOpacity: 1, weight: 3 })
          .bindTooltip("Posisi Anda")
          .addTo(layers);
        points.push(point);
      }

      if (points.length === 1) map.setView(points[0], 18);
      else if (points.length > 1) map.fitBounds(L.latLngBounds(points).pad(0.35), { maxZoom: 18 });
    }
    void draw();
    return () => { cancelled = true; };
  }, [locations, position, ready, selected]);

  return <div ref={containerRef} className={`location-map ${onSelect ? "location-map--selectable" : ""}`} role="region" aria-label={label} />;
}

export function EmployeeLocationPreview({ locations }: { locations: MapLocation[] }) {
  const [position, setPosition] = useState<Position>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nearest = useMemo(() => position ? locations
    .map((location) => ({ location, distanceM: distanceMeters(position, location) }))
    .sort((a, b) => a.distanceM - b.distanceM)[0] : undefined, [locations, position]);

  function locate() {
    setError("");
    setLoading(true);
    if (!navigator.geolocation) {
      setLoading(false);
      setError("Browser ini tidak mendukung akses lokasi.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ latitude: coords.latitude, longitude: coords.longitude, accuracyM: coords.accuracy });
        setLoading(false);
      },
      () => {
        setError("Lokasi tidak dapat dibaca. Aktifkan GPS dan izin lokasi lalu coba lagi.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2B3C5A]">Area absensi</h2>
          <p className="mt-1 text-sm text-slate-500">Lingkaran biru menunjukkan batas maksimal 50 meter.</p>
        </div>
        <button type="button" className="button-secondary shrink-0 px-3" onClick={locate} disabled={loading}>
          {loading ? <SpinnerGap size={19} className="animate-spin" aria-hidden="true" /> : <Crosshair size={19} weight="bold" aria-hidden="true" />}
          {loading ? "Mencari..." : "Posisi saya"}
        </button>
      </div>
      <LocationMap locations={locations} position={position} label="Peta area absensi dan posisi pengguna" />
      {nearest && position ? (
        <p className={`flex items-start gap-2 border-t px-5 py-3 text-sm font-medium ${nearest.distanceM <= Math.min(nearest.location.radiusM, 50) ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-950"}`} role="status">
          <MapPin size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
          {nearest.distanceM <= Math.min(nearest.location.radiusM, 50)
            ? `Anda berada di area ${nearest.location.name}.`
            : `Lokasi terdekat ${nearest.location.name}, sekitar ${Math.round(nearest.distanceM)} meter dari posisi Anda.`}
        </p>
      ) : null}
      {error ? <p className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-900" role="alert">{error}</p> : null}
    </section>
  );
}
