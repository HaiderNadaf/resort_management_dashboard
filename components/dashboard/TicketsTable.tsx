"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Ticket } from "@/lib/types";

type TicketsTableProps = {
  tickets: Ticket[];
  showActions?: boolean;
  onAssignClick?: () => void;
};

function statusStyles(status: Ticket["status"]) {
  if (status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status === "in_progress") return "bg-indigo-100 text-indigo-700";
  return "bg-amber-100 text-amber-700";
}

function statusText(status: Ticket["status"]) {
  if (status === "in_progress") return "In Progress";
  if (status === "completed") return "Completed";
  return "Pending";
}

function formatDateTime(value?: string | null) {
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

function ImageThumb({
  url,
  title,
  onPreview,
  emptyLabel,
}: {
  url?: string | null;
  title: string;
  onPreview: (url: string, title: string) => void;
  emptyLabel: string;
}) {
  if (!url) {
    return (
      <div className="grid h-12 w-16 place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <button type="button" onClick={() => onPreview(url, title)}>
      <img src={url} alt={title} className="h-12 w-16 rounded-md object-cover ring-1 ring-slate-200" />
    </button>
  );
}

export function TicketsTable({ tickets, showActions = false, onAssignClick }: TicketsTableProps) {
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  return (
    <>
      <div className="overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Title</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Description</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Department</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Created Time</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Completed Time</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Created By</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Assigned By</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Assigned To</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Assigned Image</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide">Work Complete Image</th>
              
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket._id} className="border-t border-slate-100 align-middle">
                {/** Latest assignment department is the strongest source for ticket department */} 
                {(() => {
                  const latestAssignment = ticket.assignmentHistory?.length
                    ? ticket.assignmentHistory[ticket.assignmentHistory.length - 1]
                    : undefined;
                  const ticketDepartment =
                    latestAssignment?.department || ticket.assignedTo?.department || ticket.createdBy?.department || "-";
                  const completedTime =
                    ticket.completedAt || (ticket.status === "completed" ? ticket.updatedAt || null : null);
                  return (
                    <>
                <td className="px-4 py-4 font-medium text-slate-800">{ticket.title}</td>
                <td className="max-w-md px-4 py-4 text-slate-600">{ticket.description}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles(ticket.status)}`}>
                    {statusText(ticket.status)}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-700">{ticketDepartment}</td>
                <td className="px-4 py-4 text-slate-700">{formatDateTime(ticket.createdAt)}</td>
                <td className="px-4 py-4 text-slate-700">{formatDateTime(completedTime)}</td>
                <td className="px-4 py-4 text-slate-700">{ticket.createdBy?.name || "-"}</td>
                <td className="px-4 py-4 text-slate-700">
                  {ticket.assignmentHistory?.length
                    ? ticket.assignmentHistory[ticket.assignmentHistory.length - 1]?.assignedBy?.name || "-"
                    : "-"}
                </td>
                <td className="px-4 py-4 text-slate-700">{ticket.assignedTo?.name || "Unassigned"}</td>
                <td className="px-4 py-4">
                  <ImageThumb
                    url={ticket.imageUrl}
                    title={`${ticket.title} - assigned image`}
                    onPreview={(url, title) => setPreviewImage({ url, title })}
                    emptyLabel="No image"
                  />
                </td>
                <td className="px-4 py-4">
                  <ImageThumb
                    url={ticket.completionImageUrl}
                    title={`${ticket.title} - completed image`}
                    onPreview={(url, title) => setPreviewImage({ url, title })}
                    emptyLabel="Pending"
                  />
                </td>
                    </>
                  );
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                <img src={previewImage.url} alt={previewImage.title} className="max-h-[75vh] w-full rounded-lg object-contain" />
              </>
            ) : null}
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
