"use client";

import { useEffect, useState } from "react";
import { MainAdminGuard } from "@/components/dashboard/MainAdminGuard";
import { getAttendanceRecords } from "@/lib/api";
import { AttendanceRecord } from "@/lib/types";
import { useDashboardStore } from "@/store/useDashboardStore";

function mapUrl(latitude: number, longitude: number, mode: "map" | "satellite") {
  const mapType = mode === "satellite" ? "k" : "m";
  return `https://maps.google.com/maps?q=${latitude},${longitude}&t=${mapType}&z=16&output=embed`;
}

export default function AttendancePage() {
  const { token } = useDashboardStore();
  const [dateFilter, setDateFilter] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMap, setActiveMap] = useState<{ id: string; type: "in" | "out"; lat: number; lng: number } | null>(null);
  const [mapMode, setMapMode] = useState<"map" | "satellite">("map");

  const load = async (date?: string) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await getAttendanceRecords(token, { date });
      setRecords(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(dateFilter || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, dateFilter]);

  return (
    <MainAdminGuard>
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-slate-900">Attendance</h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => setDateFilter("")}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {error ? <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {loading ? <p className="text-sm text-slate-500">Loading attendance...</p> : null}

        <div className="overflow-auto rounded-xl ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Phone</th>
                <th className="px-3 py-2 font-medium">Check-in Time</th>
                <th className="px-3 py-2 font-medium">Check-in Lat/Lng</th>
                <th className="px-3 py-2 font-medium">Check-out Time</th>
                <th className="px-3 py-2 font-medium">Check-out Lat/Lng</th>
              </tr>
            </thead>
            <tbody>
              {records.map((item) => (
                <tr key={item._id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{item.dateKey}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{item.user?.name || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{item.user?.phone || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{item.checkIn?.capturedAtLabel || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {item.checkIn ? (
                      <button
                        type="button"
                        className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                        onClick={() =>
                          setActiveMap({
                            id: item._id,
                            type: "in",
                            lat: item.checkIn!.latitude,
                            lng: item.checkIn!.longitude,
                          })
                        }
                      >
                        {item.checkIn.latitude.toFixed(6)}, {item.checkIn.longitude.toFixed(6)} (Map)
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{item.checkOut?.capturedAtLabel || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {item.checkOut ? (
                      <button
                        type="button"
                        className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"
                        onClick={() =>
                          setActiveMap({
                            id: item._id,
                            type: "out",
                            lat: item.checkOut!.latitude,
                            lng: item.checkOut!.longitude,
                          })
                        }
                      >
                        {item.checkOut.latitude.toFixed(6)}, {item.checkOut.longitude.toFixed(6)} (Map)
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {!loading && records.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={7}>
                    No attendance records found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {activeMap ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-5xl rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-2xl">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Route &amp; Availability Status</p>
                  <p className="text-xs text-slate-500">
                    {activeMap.type === "in" ? "Check-in" : "Check-out"} location: {activeMap.lat.toFixed(6)},{" "}
                    {activeMap.lng.toFixed(6)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMap(null)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                >
                  Close
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setMapMode("map")}
                    className={`rounded px-3 py-1 text-xs font-semibold ${
                      mapMode === "map" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Map
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapMode("satellite")}
                    className={`rounded px-3 py-1 text-xs font-semibold ${
                      mapMode === "satellite" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Satellite
                  </button>
                </div>
                <iframe
                  title="Attendance location map"
                  src={mapUrl(activeMap.lat, activeMap.lng, mapMode)}
                  className="h-80 w-full"
                />
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </MainAdminGuard>
  );
}
