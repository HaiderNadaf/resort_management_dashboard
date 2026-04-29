"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";

export function MainAdminGuard({ children }: { children: ReactNode }) {
  const { user } = useDashboardStore();

  if (!user || user.role !== "admin" || !user.isMainAdmin) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Access Restricted</h2>
        <p className="mt-1 text-sm text-slate-600">Only main admin can access this dashboard.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
          Go to Login
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
