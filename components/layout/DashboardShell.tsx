"use client";

import { ReactNode, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((prev) => !prev)} />
      <div className="md:pl-64">
        <main className="min-h-screen">
          <Header />
          <div className="mx-auto w-full max-w-[1400px] p-4 md:p-5 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
