"use client";

import { MapPinIcon } from "@heroicons/react/24/solid";
import { GoogleMap, LoadScript, Marker, Polyline } from "@react-google-maps/api";
import { useCallback, useMemo } from "react";

export type RoutePoint = {
  latitude: number;
  longitude: number;
  capturedAtLabel?: string;
};

const MAP_HEIGHT_PX = 500;

const mapContainerStyle = {
  width: "100%",
  height: `${MAP_HEIGHT_PX}px`,
};

type EmployeeRouteMapProps = {
  pings: RoutePoint[];
  checkIn?: RoutePoint | null;
  checkOut?: RoutePoint | null;
  onShift: boolean;
  mapMode: "map" | "satellite";
  onMapModeChange?: (mode: "map" | "satellite") => void;
  employeeName: string;
  showOverlayControls?: boolean;
};

function getApiKey() {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
}

function pinIconUrl(label: "S" | "E") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="13" fill="#ea4335" stroke="#fff" stroke-width="3"/>
    <text x="16" y="21" text-anchor="middle" fill="#fff" font-size="14" font-weight="700" font-family="Roboto,Arial,sans-serif">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildRoute(
  pings: RoutePoint[],
  checkIn?: RoutePoint | null,
  checkOut?: RoutePoint | null,
  onShift?: boolean
) {
  const path: { lat: number; lng: number }[] = [];

  if (pings.length > 0) {
    pings.forEach((p) => path.push({ lat: p.latitude, lng: p.longitude }));
  } else if (checkIn) {
    path.push({ lat: checkIn.latitude, lng: checkIn.longitude });
    if (checkOut && !onShift) {
      path.push({ lat: checkOut.latitude, lng: checkOut.longitude });
    }
  }

  if (path.length === 0) return null;

  const start = path[0];
  let end = path[path.length - 1];
  if (!onShift && checkOut && pings.length === 0) {
    end = { lat: checkOut.latitude, lng: checkOut.longitude };
    if (path.length === 1) path.push(end);
  } else if (!onShift && checkOut && pings.length > 0) {
    const out = { lat: checkOut.latitude, lng: checkOut.longitude };
    const last = path[path.length - 1];
    if (last.lat !== out.lat || last.lng !== out.lng) {
      path.push(out);
      end = out;
    }
  }

  return { path, start, end };
}

export function googleMapsDirUrl(points: RoutePoint[]) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `https://www.google.com/maps?q=${points[0].latitude},${points[0].longitude}`;
  }
  const path = points.map((p) => `${p.latitude},${p.longitude}`).join("/");
  return `https://www.google.com/maps/dir/${path}`;
}

function MapModeToggle({
  mapMode,
  onMapModeChange,
}: {
  mapMode: "map" | "satellite";
  onMapModeChange: (mode: "map" | "satellite") => void;
}) {
  return (
    <div className="absolute left-3 top-3 z-10 flex overflow-hidden rounded-sm border border-slate-300 bg-white shadow-md">
      <button
        type="button"
        onClick={() => onMapModeChange("map")}
        className={`px-4 py-2 text-sm font-medium ${
          mapMode === "map" ? "bg-white text-slate-900" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
        }`}
      >
        Map
      </button>
      <button
        type="button"
        onClick={() => onMapModeChange("satellite")}
        className={`border-l border-slate-300 px-4 py-2 text-sm font-medium ${
          mapMode === "satellite"
            ? "bg-white text-slate-900"
            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
        }`}
      >
        Satellite
      </button>
    </div>
  );
}

function GoogleRouteMapInner({
  path,
  start,
  end,
  midPings,
  showLine,
  mapMode,
  onMapModeChange,
  showOverlayControls,
}: {
  path: { lat: number; lng: number }[];
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  midPings: { lat: number; lng: number }[];
  showLine: boolean;
  mapMode: "map" | "satellite";
  onMapModeChange?: (mode: "map" | "satellite") => void;
  showOverlayControls: boolean;
}) {
  const mapTypeId = mapMode === "satellite" ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP;

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      if (path.length === 1) {
        map.setCenter(path[0]);
        map.setZoom(16);
        return;
      }
      const bounds = new google.maps.LatLngBounds();
      path.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, 56);
      google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        const zoom = map.getZoom();
        if (zoom != null && zoom > 17) map.setZoom(17);
      });
    },
    [path]
  );

  const pinIcon = useCallback(
    (label: "S" | "E"): google.maps.Icon => ({
      url: pinIconUrl(label),
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16),
    }),
    []
  );

  const midIcon = useMemo(
    (): google.maps.Symbol => ({
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: "#34a853",
      fillOpacity: 1,
      strokeColor: "#188038",
      strokeWeight: 2,
      scale: 5,
    }),
    []
  );

  return (
    <div className="relative" style={{ height: MAP_HEIGHT_PX }}>
      {showOverlayControls && onMapModeChange ? (
        <MapModeToggle mapMode={mapMode} onMapModeChange={onMapModeChange} />
      ) : null}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={start}
        zoom={16}
        mapTypeId={mapTypeId}
        onLoad={onMapLoad}
        options={{
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true,
        }}
      >
        {showLine ? (
          <Polyline
            path={path}
            options={{
              strokeColor: "#34a853",
              strokeWeight: 6,
              strokeOpacity: 0.95,
              geodesic: true,
            }}
          />
        ) : null}

        {midPings.map((pos, i) => (
          <Marker key={`mid-${i}`} position={pos} icon={midIcon} />
        ))}

        <Marker position={start} icon={pinIcon("S")} />
        {showLine || start.lat !== end.lat || start.lng !== end.lng ? (
          <Marker position={end} icon={pinIcon("E")} />
        ) : null}
      </GoogleMap>
    </div>
  );
}

function EmployeeRouteMapBody(props: EmployeeRouteMapProps) {
  const { pings, checkIn, checkOut, onShift, mapMode, onMapModeChange, employeeName, showOverlayControls = true } =
    props;

  const route = useMemo(
    () => buildRoute(pings, checkIn, checkOut, onShift),
    [pings, checkIn, checkOut, onShift]
  );

  if (!route) {
    return (
      <div
        className="flex items-center justify-center bg-slate-100 text-sm text-slate-500"
        style={{ height: MAP_HEIGHT_PX }}
      >
        No route data for {employeeName} yet.
      </div>
    );
  }

  const { path, start, end } = route;
  const showLine = path.length > 1;
  const midPings =
    pings.length > 2
      ? pings.slice(1, -1).map((p) => ({ lat: p.latitude, lng: p.longitude }))
      : [];

  return (
    <GoogleRouteMapInner
      path={path}
      start={start}
      end={end}
      midPings={midPings}
      showLine={showLine}
      mapMode={mapMode}
      onMapModeChange={onMapModeChange}
      showOverlayControls={showOverlayControls}
    />
  );
}

export default function EmployeeRouteMap(props: EmployeeRouteMapProps) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 bg-amber-50 px-4 text-center text-amber-900"
        style={{ height: MAP_HEIGHT_PX }}
      >
        <p className="text-sm font-medium">Google Maps API key missing</p>
        <p className="max-w-md text-xs">
          Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to <code>dashboard/.env</code> and restart{" "}
          <code>npm run dev</code>.
        </p>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} loadingElement={<MapLoading />}>
      <EmployeeRouteMapBody {...props} />
    </LoadScript>
  );
}

function MapLoading() {
  return (
    <div
      className="flex items-center justify-center bg-slate-100 text-sm text-slate-500"
      style={{ height: MAP_HEIGHT_PX }}
    >
      Loading Google Maps...
    </div>
  );
}

type RouteAvailabilityCardProps = {
  employeeName: string;
  subtitle: string;
  pings: RoutePoint[];
  checkIn?: RoutePoint | null;
  checkOut?: RoutePoint | null;
  onShift: boolean;
  mapMode: "map" | "satellite";
  onMapModeChange: (mode: "map" | "satellite") => void;
  loading?: boolean;
};

export function RouteAvailabilityCard({
  employeeName,
  subtitle,
  pings,
  checkIn,
  checkOut,
  onShift,
  mapMode,
  onMapModeChange,
  loading,
}: RouteAvailabilityCardProps) {
  const googleUrl = googleMapsDirUrl(
    pings.length > 0 ? pings : [checkIn, checkOut].filter((p): p is RoutePoint => p != null)
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="flex gap-2">
          <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Route &amp; Availability Status</p>
            <p className="text-xs text-slate-500">
              {employeeName}
              {subtitle ? ` · ${subtitle}` : ""}
              {loading ? " · Updating..." : ""}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#ea4335] text-[10px] font-bold text-white">
                  S
                </span>
                Start
              </span>
              <span className="mx-2 text-slate-300">→</span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#ea4335] text-[10px] font-bold text-white">
                  E
                </span>
                {onShift ? "Current" : "End"}
              </span>
              <span className="mx-2 text-slate-300">·</span>
              <span className="font-medium text-[#34a853]">{pings.length} GPS points</span>
            </p>
          </div>
        </div>
        {googleUrl ? (
          <a
            href={googleUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Open in Google Maps
          </a>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <EmployeeRouteMap
          pings={pings}
          checkIn={checkIn}
          checkOut={checkOut}
          onShift={onShift}
          mapMode={mapMode}
          onMapModeChange={onMapModeChange}
          employeeName={employeeName}
          showOverlayControls
        />
      </div>
    </div>
  );
}
