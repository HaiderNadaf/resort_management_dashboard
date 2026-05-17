"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/dashboard/AdminGuard";
import type { RoutePoint } from "@/components/tracking/EmployeeRouteMap";
import { getLiveTracking, getTrackingTrail } from "@/lib/api";
import { LiveTrackingEmployee, LiveTrackingSummary, TrackingTrail } from "@/lib/types";
import { todayDateKey } from "@/lib/date-key";
import { useDashboardStore } from "@/store/useDashboardStore";

const RouteAvailabilityCard = dynamic(
  () => import("@/components/tracking/EmployeeRouteMap").then((m) => m.RouteAvailabilityCard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
        Loading route map...
      </div>
    ),
  }
);

function toRoutePoint(
  loc?: { latitude: number; longitude: number; capturedAtLabel?: string } | null
): RoutePoint | null {
  if (!loc) return null;
  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    capturedAtLabel: loc.capturedAtLabel,
  };
}

export default function LiveTrackingPage() {
  const { token } = useDashboardStore();
  const [dateFilter, setDateFilter] = useState(todayDateKey());
  const [showAll, setShowAll] = useState(true);
  const [employees, setEmployees] = useState<LiveTrackingEmployee[]>([]);
  const [summary, setSummary] = useState<LiveTrackingSummary>({ total: 0, onShift: 0, withLocation: 0 });
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [trail, setTrail] = useState<TrackingTrail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [trailLoading, setTrailLoading] = useState(false);
  const [mapMode, setMapMode] = useState<"map" | "satellite">("satellite");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLive = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await getLiveTracking(token, { date: dateFilter, includeAll: showAll });
      if (data.dateKey && data.dateKey !== dateFilter) {
        setDateFilter(data.dateKey);
      }
      setEmployees(data.employees);
      setSummary(data.summary);
      setSelectedUserId((prev) => {
        if (prev && data.employees.some((item) => item.user._id === prev)) return prev;
        return data.employees[0]?.user._id ?? "";
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load live tracking");
    } finally {
      setLoading(false);
    }
  }, [token, dateFilter, showAll]);

  const loadTrail = useCallback(
    async (userId: string) => {
      if (!token || !userId) return;
      setTrailLoading(true);
      try {
        const data = await getTrackingTrail(token, { userId, date: dateFilter });
        setTrail(data);
      } catch {
        setTrail(null);
      } finally {
        setTrailLoading(false);
      }
    },
    [token, dateFilter]
  );

  useEffect(() => {
    loadLive();
  }, [loadLive]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      loadLive();
      if (selectedUserId) loadTrail(selectedUserId);
    }, 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, loadLive, loadTrail, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) loadTrail(selectedUserId);
  }, [selectedUserId, loadTrail]);

  const selected = useMemo(
    () => employees.find((item) => item.user._id === selectedUserId) ?? null,
    [employees, selectedUserId]
  );

  const routePings = useMemo(() => trail?.pings ?? [], [trail]);

  const routeSubtitle = useMemo(() => {
    if (!selected) return "";
    const start = routePings[0] || selected.checkIn;
    const end = routePings[routePings.length - 1] || selected.lastPing || selected.checkOut;
    if (start && end) {
      return `${start.latitude.toFixed(6)}, ${start.longitude.toFixed(6)} → ${end.latitude.toFixed(6)}, ${end.longitude.toFixed(6)}`;
    }
    return selected.onShift ? "On shift — waiting for GPS trail" : "Checked out";
  }, [selected, routePings]);

  return (
    <AdminGuard>
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Live Employee Tracking</h2>
              <p className="text-sm text-slate-500">Select an employee to view route with Start (S) and End (E).</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
                Include checked-out
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                Auto-refresh (30s)
              </label>
              <button
                type="button"
                onClick={() => {
                  loadLive();
                  if (selectedUserId) loadTrail(selectedUserId);
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Employees</p>
              <p className="text-lg font-semibold text-slate-900">{summary.total}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
              <p className="text-xs text-emerald-700">On shift</p>
              <p className="text-lg font-semibold text-emerald-900">{summary.onShift}</p>
            </div>
            <div className="rounded-lg bg-indigo-50 px-3 py-2 ring-1 ring-indigo-200">
              <p className="text-xs text-indigo-700">With location</p>
              <p className="text-lg font-semibold text-indigo-900">{summary.withLocation}</p>
            </div>
          </div>

          {error ? <p className="mt-3 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="rounded-xl border border-slate-200 bg-white p-3 lg:col-span-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Employees</h3>
            <div className="max-h-[560px] space-y-2 overflow-auto">
              {employees.map((item) => (
                <button
                  key={item.user._id}
                  type="button"
                  onClick={() => setSelectedUserId(item.user._id)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm ${
                    item.user._id === selectedUserId
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-slate-50 hover:bg-white"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{item.user.name}</p>
                  <p className="text-xs text-slate-500">{item.user.department || "—"}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.onShift ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.onShift ? "On shift" : "Checked out"}
                  </span>
                </button>
              ))}
              {!loading && employees.length === 0 ? (
                <p className="text-sm text-slate-500">No employees for this date.</p>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-9">
            {selected ? (
              <RouteAvailabilityCard
                key={`${selected.user._id}-${dateFilter}`}
                employeeName={selected.user.name}
                subtitle={routeSubtitle}
                pings={routePings}
                checkIn={toRoutePoint(selected.checkIn)}
                checkOut={toRoutePoint(selected.checkOut)}
                onShift={selected.onShift}
                mapMode={mapMode}
                onMapModeChange={setMapMode}
                loading={trailLoading}
              />
            ) : (
              <div className="flex h-80 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                Select an employee to view Route &amp; Availability Status.
              </div>
            )}
          </div>
        </div>
      </section>
    </AdminGuard>
  );
}
