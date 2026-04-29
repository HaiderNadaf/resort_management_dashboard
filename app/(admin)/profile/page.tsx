"use client";

import { useRouter } from "next/navigation";
import { MainAdminGuard } from "@/components/dashboard/MainAdminGuard";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useDashboardStore();

  return (
    <MainAdminGuard>
      <div className="max-w-xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={`${user.name} profile`}
              className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-200"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-xl font-semibold text-slate-500">
              {String(user?.name || "?")
                .slice(0, 1)
                .toUpperCase()}
            </div>
          )}
          <div className="text-sm text-slate-500">
            <p>Employee Profile</p>
            <p className="text-xs">Managed by admin account</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="font-medium text-slate-700">Name:</span> {user?.name}
          </p>
          <p>
            <span className="font-medium text-slate-700">Phone:</span> {user?.phone || "-"}
          </p>
          <p>
            <span className="font-medium text-slate-700">Role:</span> Admin
          </p>
        </div>
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Logout
        </button>
      </div>
    </MainAdminGuard>
  );
}
