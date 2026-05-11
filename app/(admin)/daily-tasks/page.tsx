"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { getAdminDailyTasks } from "@/lib/api";
import { DailyTask } from "@/lib/types";
import { MainAdminGuard } from "@/components/dashboard/MainAdminGuard";
import { useDashboardStore } from "@/store/useDashboardStore";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DailyTasksPage() {
  const { token, users, loadData } = useDashboardStore();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [date, setDate] = useState(todayKey());
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const departmentOptions = useMemo(() => {
    const values = users.map((user) => String(user.department || "").trim()).filter(Boolean);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [users]);

  useEffect(() => {
    if (token) void loadData();
  }, [token, loadData]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const data = await getAdminDailyTasks(token, {
          date,
          ...(department ? { department } : {}),
        });
        setTasks(data);
      } catch (e) {
        setTasks([]);
        setError(e instanceof Error ? e.message : "Failed to load daily tasks");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token, date, department]);

  return (
    <>
    <MainAdminGuard>
      <section className="space-y-4 rounded-2xl bg-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[30px] font-semibold leading-tight text-slate-900">Daily Tasks</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          />
          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="h-10 min-w-52 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">All departments</option>
            {departmentOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

        <div className="overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Employee</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Department</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Task</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Start Time</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">End Time</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Task Image</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} className="border-t border-slate-100 align-middle">
                  <td className="px-4 py-4 text-slate-700">{task.employee?.name || "-"}</td>
                  <td className="px-4 py-4 text-slate-700">{task.department || "-"}</td>
                  <td className="px-4 py-4 text-slate-700">
                    <p className="font-medium text-slate-800">{task.taskTitle}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{formatDate(task.startTime)}</td>
                  <td className="px-4 py-4 text-slate-700">{formatDate(task.endTime)}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        task.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {task.status === "completed" ? "Completed" : "Started"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {task.startImageUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: task.startImageUrl,
                            title: `${task.taskTitle} - task image`,
                          })
                        }
                        className="inline-flex"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={task.startImageUrl}
                          alt={`${task.taskTitle} task image`}
                          className="h-12 w-16 rounded-md object-cover ring-1 ring-slate-200"
                        />
                      </button>
                    ) : (
                      <div className="grid h-12 w-16 place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
                        No image
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && tasks.length === 0 ? <p className="text-sm text-slate-500">No daily task records found for selected filters.</p> : null}
        {loading ? <p className="text-sm text-slate-500">Loading daily tasks...</p> : null}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImage.url} alt={previewImage.title} className="max-h-[75vh] w-full rounded-lg object-contain" />
            </>
          ) : null}
        </DialogPanel>
      </div>
    </Dialog>
    </>
  );
}
