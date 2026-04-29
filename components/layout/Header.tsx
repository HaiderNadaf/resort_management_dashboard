"use client";

import { BellIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/useDashboardStore";

export function Header() {
  const router = useRouter();
  const { user, logout } = useDashboardStore();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="mb-5 h-16 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2.5 text-white shadow-sm">
      <div>
 
        <p className="text-[11px] text-slate-300">{today}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-md border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800">
          <BellIcon className="h-4 w-4" />
        </button>
        <div className="text-right text-xs leading-tight">
          <p className="font-medium text-white">{user?.name || "Admin"}</p>
          <p className="text-slate-300">Main Admin</p>
        </div>
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
