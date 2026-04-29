"use client";

import { useEffect, useMemo, useState } from "react";
import { MainAdminGuard } from "@/components/dashboard/MainAdminGuard";
import {
  getRoomInspectionCalendar,
  getRoomInspectionDashboard,
  getRoomInspectionsByCategory,
} from "@/lib/api";
import { RoomInspection, RoomInspectionCategoryCard, RoomInspectionDay } from "@/lib/types";
import { useDashboardStore } from "@/store/useDashboardStore";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function prettyDateLabel(value: Date) {
  return value.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function roomStatusText(status: RoomInspection["status"]) {
  if (status === "completed") return "Complete";
  if (status === "in_progress") return "In Progress";
  return "Not Started";
}

function roomStatusClass(status: RoomInspection["status"]) {
  if (status === "completed") return "bg-emerald-700 text-white";
  if (status === "in_progress") return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

function calendarColorClass(color: RoomInspectionDay["color"]) {
  if (color === "green") return "bg-emerald-100 text-emerald-700";
  if (color === "yellow") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

export default function RoomInspectionsPage() {
  const { token } = useDashboardStore();
  const [cursor, setCursor] = useState(new Date());
  const [categories, setCategories] = useState<RoomInspectionCategoryCard[]>([]);
  const [days, setDays] = useState<RoomInspectionDay[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [rooms, setRooms] = useState<RoomInspection[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedDate = dateKey(cursor);
  const selectedMonth = monthKey(cursor);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    Promise.all([getRoomInspectionDashboard(token, selectedDate), getRoomInspectionCalendar(token, selectedMonth)])
      .then(([dashboard, calendar]) => {
        setCategories(dashboard.categories || []);
        setDays(calendar || []);
        const firstCategory = dashboard.categories?.[0]?.categoryKey ?? "";
        setSelectedCategory((prev) => {
          if (prev && dashboard.categories?.some((item) => item.categoryKey === prev)) {
            return prev;
          }
          return firstCategory;
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load room inspections"));
  }, [token, selectedDate, selectedMonth]);

  useEffect(() => {
    if (!token || !selectedCategory) {
      setRooms([]);
      setIsLoading(false);
      return;
    }
    getRoomInspectionsByCategory(token, selectedDate, selectedCategory)
      .then((data) => setRooms(data))
      .catch(() => setRooms([]))
      .finally(() => setIsLoading(false));
  }, [token, selectedCategory, selectedDate]);

  const totalRooms = categories.reduce((sum, item) => sum + item.totalRooms, 0);
  const completedRooms = categories.reduce((sum, item) => sum + item.completedRooms, 0);
  const inProgressRooms = rooms.filter((room) => room.status === "in_progress").length;
  const pendingRooms = rooms.filter((room) => room.status === "pending").length;

  const checklistColumns = useMemo(() => {
    const seen = new Set<string>();
    const columns: string[] = [];
    rooms.forEach((room) => {
      (room.checklist || []).forEach((item) => {
        const normalized = item.label.trim();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          columns.push(normalized);
        }
      });
    });
    return columns;
  }, [rooms]);

  const selectedCategoryName =
    categories.find((item) => item.categoryKey === selectedCategory)?.categoryName || "Room Category";
  const overallProgress = totalRooms > 0 ? Math.round((completedRooms / totalRooms) * 100) : 0;
  const lastUpdatedLabel = useMemo(() => {
    const timestamps = rooms.map((item) => item.createdAt || item.completedAt).filter(Boolean) as string[];
    if (!timestamps.length) return "--";
    const latest = timestamps.sort().at(-1);
    if (!latest) return "--";
    return new Date(latest).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }, [rooms]);

  const monthSummary = useMemo(() => {
    const green = days.filter((d) => d.color === "green").length;
    const yellow = days.filter((d) => d.color === "yellow").length;
    const red = days.filter((d) => d.color === "red").length;
    return { green, yellow, red };
  }, [days]);

  return (
    <MainAdminGuard>
      <section className="space-y-5 rounded-2xl border border-[#d7e2db] bg-[#f5f8f5] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Today&apos;s Progress</h2>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
            Last updated: {lastUpdatedLabel}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => {
            const progressPercent = category.totalRooms
              ? Math.round((category.completedRooms / category.totalRooms) * 100)
              : 0;
            const categoryRooms = rooms.filter((item) => item.categoryKey === category.categoryKey);
            const categoryInProgress = categoryRooms.some((item) => item.status === "in_progress");
            const categoryStatusLabel =
              category.completedRooms === category.totalRooms && category.totalRooms > 0
                ? "Complete"
                : categoryInProgress
                ? "In Progress"
                : "Not Started";
            const categoryStatusClass =
              categoryStatusLabel === "Complete"
                ? "bg-emerald-700 text-white"
                : categoryStatusLabel === "In Progress"
                ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                : "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
            return (
              <button
                type="button"
                key={category.categoryKey}
                onClick={() => setSelectedCategory(category.categoryKey)}
                className={`rounded-xl border bg-white p-3 text-left shadow-sm ${
                  selectedCategory === category.categoryKey ? "border-emerald-700 ring-2 ring-emerald-100" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{category.categoryName}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${categoryStatusClass}`}>
                    {categoryStatusLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {category.completedRooms}/{category.totalRooms} rooms checked
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-emerald-700" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="mt-1 text-right text-xs font-semibold text-slate-600">{progressPercent}%</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Room Inspection Sheet</h3>
              <p className="text-xs text-slate-500">Verify checklist items for each room</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
                {completedRooms} Completed
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">
                {inProgressRooms} In Progress
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
                {pendingRooms} Not Started
              </span>
              <button
                type="button"
                onClick={() => setCursor(new Date())}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700"
              >
                Today
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <button
                type="button"
                key={category.categoryKey}
                onClick={() => setSelectedCategory(category.categoryKey)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  selectedCategory === category.categoryKey
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {category.categoryName}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="font-semibold">
              Date: <span className="text-slate-900">{prettyDateLabel(cursor)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = new Date(cursor);
                  next.setDate(next.getDate() - 1);
                  setCursor(next);
                }}
                className="rounded border border-slate-300 bg-white px-2 py-1"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = new Date(cursor);
                  next.setDate(next.getDate() + 1);
                  setCursor(next);
                }}
                className="rounded border border-slate-300 bg-white px-2 py-1"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Room</th>
                  {checklistColumns.map((column) => (
                    <th key={column} className="border-b border-slate-200 px-2 py-2 text-center font-semibold">
                      {column}
                    </th>
                  ))}
                  <th className="border-b border-slate-200 px-3 py-2 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const checksByLabel = new Map((room.checklist || []).map((item) => [item.label.trim(), item.isChecked]));
                  return (
                    <tr key={room._id} className="bg-white">
                      <td className="border-b border-slate-100 px-3 py-2 font-medium text-slate-700">{room.roomLabel}</td>
                      {checklistColumns.map((column) => (
                        <td key={`${room._id}-${column}`} className="border-b border-slate-100 px-2 py-2 text-center">
                          {checksByLabel.get(column) ? (
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-100 text-[10px] font-bold text-emerald-700">
                              ✓
                            </span>
                          ) : (
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-rose-50 text-[10px] font-bold text-rose-500">
                              ×
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="border-b border-slate-100 px-3 py-2 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${roomStatusClass(room.status)}`}>
                          {roomStatusText(room.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!isLoading && rooms.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-500">No rooms found for selected category/day.</p>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs md:grid-cols-4">
            <div>
              <p className="text-slate-500">Today&apos;s Total</p>
              <p className="text-base font-semibold text-slate-900">
                {completedRooms} / {totalRooms}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Overall Complete</p>
              <p className="text-base font-semibold text-emerald-700">{overallProgress}% Complete</p>
            </div>
            <div>
              <p className="text-slate-500">Selected Category</p>
              <p className="text-base font-semibold text-slate-900">{selectedCategoryName}</p>
            </div>
            <div>
              <p className="text-slate-500">Month Summary</p>
              <p className="text-base font-semibold text-slate-900">
                {monthSummary.green} / {monthSummary.yellow} / {monthSummary.red}
              </p>
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-900">Monthly Calendar Status</h3>
          <p className="mt-1 text-xs text-slate-500">{selectedMonth}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {days.map((day) => (
              <div key={day.date} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-xs">
                <span className="text-slate-700">{day.date}</span>
                <span className={`rounded-full px-2 py-0.5 font-semibold ${calendarColorClass(day.color)}`}>
                  {day.completed}/{day.total}
                </span>
              </div>
            ))}
            {!days.length ? <p className="text-sm text-slate-500">No calendar data available.</p> : null}
          </div>
        </section>

        {error ? (
          <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        {isLoading ? <p className="text-sm text-slate-500">Loading room inspections...</p> : null}
      </section>
    </MainAdminGuard>
  );
}
