"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getAdminDailyTasks } from "@/lib/api";
import { DailyTask } from "@/lib/types";
import { MainAdminGuard } from "@/components/dashboard/MainAdminGuard";
import { useDashboardStore } from "@/store/useDashboardStore";

const ALL_DEPARTMENTS = "__all__";

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function DepartmentActivityPage() {
  const { token, users, loadData } = useDashboardStore();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [date, setDate] = useState(todayKey());
  const [activeDept, setActiveDept] = useState<string>(ALL_DEPARTMENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (token) void loadData();
  }, [token, loadData]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const data = await getAdminDailyTasks(token, { date });
        setTasks(data);
      } catch (e) {
        setTasks([]);
        setError(e instanceof Error ? e.message : "Failed to load department activity");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token, date]);

  const departmentOptions = useMemo(() => {
    const fromUsers = users.map((user) => String(user.department || "").trim()).filter(Boolean);
    const fromTasks = tasks.map((task) => String(task.department || "").trim()).filter(Boolean);
    return Array.from(new Set([...fromUsers, ...fromTasks])).sort((a, b) => a.localeCompare(b));
  }, [users, tasks]);

  const visibleTasks = useMemo(() => {
    if (activeDept === ALL_DEPARTMENTS) return tasks;
    return tasks.filter((task) => String(task.department || "").trim() === activeDept);
  }, [tasks, activeDept]);

  const groupedByDept = useMemo(() => {
    const map = new Map<string, DailyTask[]>();
    for (const task of visibleTasks) {
      const key = String(task.department || "Unassigned").trim() || "Unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visibleTasks]);

  return (
    <MainAdminGuard>
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[28px] font-semibold leading-tight text-slate-900">Department Activity</h2>
            <p className="text-sm text-slate-500">Live daily task activity across all departments.</p>
          </div>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveDept(ALL_DEPARTMENTS)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeDept === ALL_DEPARTMENTS
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            All Departments
          </button>
          {departmentOptions.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setActiveDept(dept)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeDept === dept
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

        {loading ? <p className="text-sm text-slate-500">Loading department activity...</p> : null}

        {!loading && visibleTasks.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">No daily activity recorded for the selected filters.</p>
          </div>
        ) : null}

        <div className="space-y-6">
          {groupedByDept.map(([dept, list]) => {
            const startedCount = list.filter((task) => task.status === "started").length;
            const completedCount = list.filter((task) => task.status === "completed").length;
            return (
              <div key={dept} className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-base font-semibold text-slate-900">{dept}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {list.length} total
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    {completedCount} completed
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    {startedCount} started
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((task) => {
                    const imageUrl = task.endImageUrl || task.startImageUrl || null;
                    return (
                      <div
                        key={task._id}
                        className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
                      >
                        {imageUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewUrl(imageUrl)}
                            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100"
                          >
                            <Image
                              src={imageUrl}
                              alt={task.taskTitle}
                              fill
                              sizes="96px"
                              className="object-cover"
                              unoptimized
                            />
                          </button>
                        ) : (
                          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs text-slate-400">
                            No Image
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">{task.taskTitle}</p>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                task.status === "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {task.status === "completed" ? "Completed" : "Started"}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-600">
                            Employee: <span className="font-medium text-slate-800">{task.employee?.name || "-"}</span>
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">Start: {formatTime(task.startTime)}</p>
                          <p className="text-xs text-slate-500">End: {formatTime(task.endTime)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {previewUrl ? (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Task Image</p>
                <button
                  type="button"
                  onClick={() => setPreviewUrl(null)}
                  className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
              <div className="relative h-[70vh] w-full bg-slate-50">
                <Image src={previewUrl} alt="Daily task" fill className="object-contain" unoptimized />
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </MainAdminGuard>
  );
}
