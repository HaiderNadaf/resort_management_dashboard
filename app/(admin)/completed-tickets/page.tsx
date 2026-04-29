"use client";

import { useEffect } from "react";
import { MainAdminGuard } from "@/components/dashboard/MainAdminGuard";
import { TicketsTable } from "@/components/dashboard/TicketsTable";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function CompletedTicketsPage() {
  const { token, tickets, loadData } = useDashboardStore();

  useEffect(() => {
    if (token) void loadData();
  }, [token, loadData]);

  const completedTickets = tickets.filter((ticket) => ticket.status === "completed");

  return (
    <MainAdminGuard>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Completed Tickets</h2>
        <TicketsTable tickets={completedTickets} />
      </div>
    </MainAdminGuard>
  );
}
