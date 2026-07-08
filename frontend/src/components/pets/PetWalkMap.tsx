"use client";

import { useEffect, useMemo } from "react";

import { Circle, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { divIcon, type LatLngExpression } from "leaflet";

import type { PetWalkSessionDto } from "@/types/petWalk";

type Props = {
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  nearbySessions: PetWalkSessionDto[];
  geoLoading: boolean;
  geoMessage: string | null;
  onRefreshLocation: () => void;
};

function createPin(color: string, label: string) {
  return divIcon({
    className: "",
    html: `
      <div style="position:relative;width:28px;height:36px;transform:translateY(-6px);">
        <div style="position:absolute;inset:0;border-radius:9999px;background:${color};box-shadow:0 0 0 10px color-mix(in srgb, ${color} 16%, transparent);opacity:.95"></div>
        <div style="position:absolute;left:7px;top:7px;width:14px;height:14px;border-radius:9999px;background:white;box-shadow:0 2px 8px rgba(0,0,0,.18)"></div>
        <div style="position:absolute;left:11px;bottom:-10px;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid ${color};"></div>
      </div>
      <div style="position:absolute;left:50%;top:38px;transform:translateX(-50%);white-space:nowrap;background:rgba(15,23,42,.88);color:white;font-size:10px;font-weight:600;padding:4px 8px;border-radius:9999px;backdrop-filter:blur(10px)">${label}</div>
    `,
    iconSize: [28, 46],
    iconAnchor: [14, 38],
    popupAnchor: [0, -36],
  });
}

function MapSync({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, Math.max(14, map.getZoom()), { duration: 0.7 });
  }, [center, map]);

  return null;
}

const SESSION_COLORS = ["#f43f5e", "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#06b6d4"];

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const earthRadiusKm = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const start =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(start), Math.sqrt(1 - start));
}

function formatWalkDuration(startedAt: string, endedAt?: string | null) {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "—";
  const seconds = Math.floor((end - start) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function PetWalkMap({
  centerLatitude,
  centerLongitude,
  radiusKm,
  nearbySessions,
  geoLoading,
  geoMessage,
  onRefreshLocation,
}: Props) {
  const center = useMemo(() => [centerLatitude, centerLongitude] as [number, number], [centerLatitude, centerLongitude]);
  const centerPoint: LatLngExpression = center;
  const radiusMeters = Math.max(250, radiusKm * 1000);
  const activeCount = nearbySessions.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="relative">
      <MapContainer
        center={centerPoint}
        zoom={15}
        zoomControl={false}
        scrollWheelZoom
        className="h-[460px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        <ZoomControl position="bottomright" />
        <MapSync center={center} />
        <Circle
          center={centerPoint}
          radius={radiusMeters}
          pathOptions={{ color: "#f43f5e", fillColor: "#fb7185", fillOpacity: 0.1, weight: 2 }}
        />
        {/* User location marker */}
        <Marker position={centerPoint} icon={createPin("#0f172a", "Bạn")}>
          <Popup>
            <div className="min-w-[160px]">
              <p className="font-semibold text-slate-900">Vị trí của bạn</p>
              <p className="mt-1 text-xs text-slate-500">
                {centerLatitude.toFixed(5)}, {centerLongitude.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
        {/* Nearby session markers */}
        {nearbySessions.map((session, index) => (
          <Marker
            key={session.id}
            position={[session.currentLatitude, session.currentLongitude]}
            icon={createPin(
              SESSION_COLORS[index % SESSION_COLORS.length],
              session.petName ?? `Pet`
            )}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{session.petName ?? `Pet #${session.petId}`}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    session.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {session.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{session.routeName ?? "Đi dạo tự do"} · {session.visibility}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Quãng đường: {distanceKm(
                    session.startLatitude,
                    session.startLongitude,
                    session.currentLatitude,
                    session.currentLongitude
                  ).toFixed(2)} km
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Thời gian: {formatWalkDuration(session.startedAt, session.endedAt)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {session.currentLatitude.toFixed(5)}, {session.currentLongitude.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-center justify-between gap-2 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            {nearbySessions.length} phiên · {activeCount} đang hoạt động
          </span>
          <span className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            R {radiusKm.toFixed(1)} km
          </span>
        </div>
        <span className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          OSM
        </span>
      </div>

      {/* Floating bottom GPS status */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] bg-gradient-to-t from-black/40 to-transparent p-4">
        <div className="pointer-events-auto ml-auto w-fit rounded-2xl border border-white/20 bg-white/90 px-4 py-2.5 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${geoLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
            <span className="text-xs font-medium text-slate-700">
              {geoLoading ? "Đang định vị..." : (geoMessage ?? "GPS sẵn sàng")}
            </span>
            <button
              type="button"
              onClick={onRefreshLocation}
              disabled={geoLoading}
              className="ml-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed"
            >
              Cập nhật
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
