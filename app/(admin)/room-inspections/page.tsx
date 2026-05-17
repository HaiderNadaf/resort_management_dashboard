"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { MainAdminGuard } from "@/components/dashboard/MainAdminGuard";
import {
  getRoomInspectionCalendar,
  getRoomInspectionDashboard,
  getRoomInspectionsByCategory,
} from "@/lib/api";
import { RoomInspection, RoomInspectionCategoryCard, RoomInspectionDay, RoomInspectionStatus } from "@/lib/types";
import { useDashboardStore } from "@/store/useDashboardStore";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

function prettyDateLabel(value: Date) {
  return value.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function roomStatusText(status: RoomInspectionStatus) {
  if (status === "completed") return "Complete";
  if (status === "occupied") return "Occupied";
  if (status === "in_progress") return "In Progress";
  return "Not Started";
}

function roomStatusClass(status: RoomInspectionStatus) {
  if (status === "completed") return "bg-emerald-700 text-white";
  if (status === "occupied") return "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200";
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
  const [dashboardSummary, setDashboardSummary] = useState({
    total: 0,
    completed: 0,
    occupied: 0,
    inProgress: 0,
    pending: 0,
  });
  const [calendarStatusFilter, setCalendarStatusFilter] = useState<"all" | RoomInspectionDay["color"]>("all");
  const [calendarDateFilter, setCalendarDateFilter] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const baseDateKey = dateKey(cursor);
  const selectedDate = calendarDateFilter || baseDateKey;
  const selectedMonth = monthKey(calendarDateFilter ? parseDateKey(calendarDateFilter) : cursor);
  const selectedDateLabel = prettyDateLabel(parseDateKey(selectedDate));

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    const calendarFilters = {
      ...(calendarStatusFilter !== "all" ? { color: calendarStatusFilter } : {}),
      ...(calendarDateFilter ? { date: calendarDateFilter } : {}),
    };
    Promise.all([
      getRoomInspectionDashboard(token, selectedDate),
      getRoomInspectionCalendar(token, selectedMonth, calendarFilters),
    ])
      .then(([dashboard, calendar]) => {
        setCategories(dashboard.categories || []);
        setDashboardSummary(dashboard.summary || { total: 0, completed: 0, occupied: 0, inProgress: 0, pending: 0 });
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
  }, [token, selectedDate, selectedMonth, calendarStatusFilter, calendarDateFilter]);

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

  const selectedCategorySummary = useMemo(() => {
    const completedStrict = rooms.filter((room) => room.status === "completed").length;
    const occupiedOnly = rooms.filter((room) => room.status === "occupied").length;
    const inProgress = rooms.filter((room) => room.status === "in_progress").length;
    const pending = rooms.filter((room) => room.status === "pending").length;
    return {
      total: rooms.length,
      completedStrict,
      occupiedOnly,
      inProgress,
      pending,
    };
  }, [rooms]);

  return (
    <>
      <MainAdminGuard>

<section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Monthly Calendar Status</h3>
              <p className="mt-1 text-xs text-slate-500">{selectedMonth}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
             
              <input
                type="date"
                value={calendarDateFilter}
                onChange={(event) => setCalendarDateFilter(event.target.value)}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
              />
              <button
                type="button"
                onClick={() => {
                  setCalendarStatusFilter("all");
                  setCalendarDateFilter("");
                }}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                Clear
              </button>
            </div>
          </div>
         
        </section>



      <section className="space-y-5 mt-2 rounded-2xl border border-[#d7e2db] bg-[#f5f8f5] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Today&apos;s Progress</h2>
            <p className="mt-1 text-xs text-slate-500">
              {categories.length} categories · {totalRooms} rooms total
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
            Last updated: {lastUpdatedLabel}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5">
          {categories.map((category) => {
            const progressPercent = category.totalRooms
              ? Math.round((category.completedRooms / category.totalRooms) * 100)
              : 0;
            const inProgress = category.inProgressRooms ?? 0;
            const categoryStatusLabel =
              category.completedRooms === category.totalRooms && category.totalRooms > 0
                ? "Complete"
                : inProgress > 0
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
                {selectedCategorySummary.completedStrict} Completed
              </span>
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-indigo-800">
                {selectedCategorySummary.occupiedOnly} Occupied
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">
                {selectedCategorySummary.inProgress} In Progress
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
                {selectedCategorySummary.pending} Not Started
              </span>
              
             
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
              Date: <span className="text-slate-900">{selectedDateLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCalendarDateFilter("");
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
                  setCalendarDateFilter("");
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
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Assigned By (Admin)</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Assigned To (Employee)</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">Notes</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-center font-semibold">Image</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const checksByLabel = new Map((room.checklist || []).map((item) => [item.label.trim(), item.isChecked]));
                  const latestAssignedBy =
                    room.assignedBy?.name ||
                    room.assignmentHistory?.[room.assignmentHistory.length - 1]?.assignedBy?.name ||
                    "-";
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
                      <td className="border-b border-slate-100 px-3 py-2 text-slate-700">
                        {latestAssignedBy}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-slate-700">
                        {room.assignedTo?.name || "-"}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-slate-700">
                        {room.notes?.trim() ? room.notes : "-"}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-center">
                        {room.progressImageUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: room.progressImageUrl!,
                                title: `${room.roomLabel} - progress image`,
                              })
                            }
                            className="inline-flex"
                          >
                            <img
                              src={room.progressImageUrl}
                              alt={`${room.roomLabel} progress`}
                              className="h-12 w-16 rounded-md object-cover ring-1 ring-slate-200"
                            />
                          </button>
                        ) : (
                          <div className="mx-auto grid h-12 w-16 place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
                            No image
                          </div>
                        )}
                      </td>
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

          
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        {isLoading ? <p className="text-sm text-slate-500">Loading room inspections...</p> : null}
      </section>
      </MainAdminGuard>

      <Dialog open={Boolean(previewImage)} onClose={() => setPreviewImage(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-4xl rounded-xl bg-white p-4 shadow-xl">
            {previewImage ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">{previewImage.title}</p>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close image preview"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <img src={previewImage.url} alt={previewImage.title} className="max-h-[75vh] w-full rounded-lg object-contain" />
              </>
            ) : null}
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
