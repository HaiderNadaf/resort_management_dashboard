"use client";

import { useEffect } from "react";
import { MainAdminGuard } from "@/components/dashboard/MainAdminGuard";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function UsersPage() {
  const { token, users, loadData } = useDashboardStore();

  useEffect(() => {
    if (token) void loadData();
  }, [token, loadData]);

  return (
    <MainAdminGuard>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Users</h2>
        <div className="overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Profile</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone Number</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Department</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={`${user.name} profile`}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                        {String(user.name || "?")
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.phone || "-"}</td>
                  <td className="px-4 py-3 capitalize text-slate-700">{user.role}</td>
                  <td className="px-4 py-3 text-slate-700">{user.department || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainAdminGuard>
  );
}
