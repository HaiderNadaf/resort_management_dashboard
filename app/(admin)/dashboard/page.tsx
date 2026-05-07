"use client";

import { useEffect } from "react";
import { MainAdminGuard } from "@/components/dashboard/MainAdminGuard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { useDashboardStore } from "@/store/useDashboardStore";

const departmentPalette = [
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

export default function DashboardPage() {
  const { tickets, token, loadData } = useDashboardStore();

  useEffect(() => {
    if (token) void loadData();
  }, [token, loadData]);

  const total = tickets.length;
  const pending = tickets.filter((ticket) => ticket.status === "pending").length;
  const inProgress = tickets.filter((ticket) => ticket.status === "in_progress").length;
  const completed = tickets.filter((ticket) => ticket.status === "completed").length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  const departmentCounts = tickets.reduce<Record<string, number>>((acc, ticket) => {
    const dept = ticket.assignedTo?.department || "Unassigned";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const deptEntries = Object.entries(departmentCounts).sort((a, b) => b[1] - a[1]);
  const topDepartment = deptEntries[0]?.[0] || "-";
  const avgPerDepartment = deptEntries.length ? (total / deptEntries.length).toFixed(1) : "0.0";

  const pieSegments = deptEntries.map(([label, value], index) => {
    const percentage = total ? (value / total) * 100 : 0;
    return {
      label,
      value,
      percentage,
      color: departmentPalette[index % departmentPalette.length],
    };
  });

  const gradient = pieSegments.length
    ? `conic-gradient(${pieSegments
        .map((segment, index) => {
          const start = pieSegments.slice(0, index).reduce((sum, item) => sum + item.percentage, 0);
          const end = start + segment.percentage;
          return `${segment.color} ${start}% ${end}%`;
        })
        .join(", ")})`
    : "conic-gradient(#cbd5e1 0% 100%)";

  return (
    <MainAdminGuard>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Tickets" value={total} accent="purple" />
          <SummaryCard label="Pending Tickets" value={pending} accent="amber" />
          <SummaryCard label="In Progress Tickets" value={inProgress} accent="indigo" />
          <SummaryCard label="Completed Tickets" value={completed} accent="emerald" />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
            <h3 className="text-base font-semibold text-slate-900">Department Ticket Distribution</h3>
            <p className="mt-1 text-sm text-slate-500">Pie chart of tickets by assigned department.</p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="grid place-items-center">
                <div
                  className="relative h-56 w-56 rounded-full"
                  style={{ background: gradient }}
                  aria-label="Department ticket pie chart"
                >
                  <div className="absolute inset-10 grid place-items-center rounded-full bg-white text-center ring-1 ring-slate-200">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-2xl font-semibold text-slate-900">{total}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {pieSegments.map((segment) => (
                  <div key={segment.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                      <span className="text-sm text-slate-700">{segment.label}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {segment.value} ({Math.round(segment.percentage)}%)
                    </span>
                  </div>
                ))}
                {pieSegments.length === 0 ? <p className="text-sm text-slate-500">No ticket data available.</p> : null}
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Quick Analysis</h3>
            <p className="mt-1 text-sm text-slate-500">Snapshot insights from current ticket load.</p>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-xs text-slate-500">Top Department</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{topDepartment}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-xs text-slate-500">Completion Rate</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{completionRate}%</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-xs text-slate-500">Avg Tickets / Department</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{avgPerDepartment}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-xs text-slate-500">Open Workload</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{pending + inProgress} open tickets</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainAdminGuard>
  );
}
