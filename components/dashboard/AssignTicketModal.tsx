"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { User } from "@/lib/types";

type AssignTicketModalProps = {
  open: boolean;
  users: User[];
  onClose: () => void;
  onSubmit: (values: AssignFormValues) => Promise<void>;
};

export type AssignFormValues = {
  title: string;
  description: string;
  department: string;
  assignedTo: string;
  image: FileList;
};

export function AssignTicketModal({ open, users, onClose, onSubmit }: AssignTicketModalProps) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<AssignFormValues>();

  const employeeUsers = users.filter((user) => user.role === "employee");
  const selectedDepartment = watch("department");
  const departments = Array.from(
    new Set(employeeUsers.map((user) => user.department).filter((department): department is string => Boolean(department)))
  );
  const departmentUsers = selectedDepartment
    ? employeeUsers.filter((user) => user.department === selectedDepartment)
    : [];

  async function submit(values: AssignFormValues) {
    await onSubmit(values);
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-slate-900">Assign Ticket</DialogTitle>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit(submit)}>
            <input
              {...register("title", { required: true })}
              placeholder="Title"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              {...register("description")}
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              {...register("department", {
                required: true,
                onChange: () => setValue("assignedTo", ""),
              })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <select
              {...register("assignedTo", { required: true })}
              disabled={!selectedDepartment}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">{selectedDepartment ? "Assign to user" : "Select department first"}</option>
              {departmentUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept="image/*"
              {...register("image", { required: true })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
                Submit
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
