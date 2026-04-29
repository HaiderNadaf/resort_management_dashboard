"use client";

import { useEffect, useMemo, useState } from "react";
import { AssignTicketModal, AssignFormValues } from "@/components/dashboard/AssignTicketModal";
import { MainAdminGuard } from "@/components/dashboard/MainAdminGuard";
import { TicketsTable } from "@/components/dashboard/TicketsTable";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function TicketsPage() {
  const {
    token,
    user,
    users,
    tickets,
    loadData,
    createTicket,
    search,
    statusFilter,
    pagination,
    setSearch,
    setStatusFilter,
    setPage,
  } = useDashboardStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (token) void loadData({ page: pagination.page });
  }, [token, statusFilter, pagination.page, loadData]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const searchTerm = search.toLowerCase().trim();
      const matchesSearch =
        !searchTerm ||
        ticket.title.toLowerCase().includes(searchTerm) ||
        ticket.description.toLowerCase().includes(searchTerm);
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  async function onAssign(values: AssignFormValues) {
    const image = values.image?.[0];
    if (!image) return;
    await createTicket({
      title: values.title,
      description: values.description,
      assignedTo: values.assignedTo,
      image,
    });
  }

  return (
    <MainAdminGuard>
      <section className="rounded-2xl bg-slate-100">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[30px] font-semibold leading-tight text-slate-900">All Tickets</h2>
          {user?.role === "admin" ? (
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              Assign Ticket
            </button>
          ) : null}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tickets"
            className="h-10 min-w-72 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | "pending" | "in_progress" | "completed")}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <TicketsTable tickets={filteredTickets} showActions={user?.role === "admin"} onAssignClick={() => setModalOpen(true)} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <p>
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total tickets)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage(pagination.page - 1)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage(pagination.page + 1)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <AssignTicketModal open={modalOpen} users={users} onClose={() => setModalOpen(false)} onSubmit={onAssign} />
    </MainAdminGuard>
  );
}
