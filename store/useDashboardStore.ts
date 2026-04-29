"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  assignTicket,
  getMe,
  getRoomInspectionCalendar,
  getRoomInspectionDashboard,
  getRoomInspectionsByCategory,
  getTickets,
  getUsers,
  loginAdmin,
} from "@/lib/api";
import {
  RoomInspection,
  RoomInspectionCategoryCard,
  RoomInspectionDay,
  Ticket,
  TicketPagination,
  TicketStatus,
  User,
} from "@/lib/types";

type DashboardStore = {
  token: string;
  user: User | null;
  users: User[];
  tickets: Ticket[];
  roomInspectionCategories: RoomInspectionCategoryCard[];
  roomInspectionRooms: RoomInspection[];
  roomInspectionCalendar: RoomInspectionDay[];
  loading: boolean;
  error: string;
  search: string;
  statusFilter: "all" | TicketStatus;
  pagination: TicketPagination;
  setSearch: (value: string) => void;
  setStatusFilter: (value: "all" | TicketStatus) => void;
  setPage: (page: number) => void;
  login: (phone: string, password: string) => Promise<boolean>;
  loadData: (options?: { page?: number; limit?: number }) => Promise<void>;
  createTicket: (payload: { title: string; description: string; assignedTo: string; image: File }) => Promise<void>;
  loadRoomInspectionData: (date: string, categoryKey?: string) => Promise<void>;
  logout: () => void;
};

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
  token: "",
  user: null,
  users: [],
  tickets: [],
  roomInspectionCategories: [],
  roomInspectionRooms: [],
  roomInspectionCalendar: [],
  loading: false,
  error: "",
  search: "",
  statusFilter: "all",
  pagination: {
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },

  setSearch: (value) => set({ search: value }),
  setStatusFilter: (value) =>
    set((state) => ({
      statusFilter: value,
      pagination: { ...state.pagination, page: 1 },
    })),
  setPage: (page) =>
    set((state) => ({
      pagination: { ...state.pagination, page: Math.max(page, 1) },
    })),

  login: async (phone, password) => {
    set({ loading: true, error: "" });
    try {
      const { token } = await loginAdmin(phone, password);
      const me = await getMe(token);
      if (me.role !== "admin" || !me.isMainAdmin) {
        throw new Error("Only main admin can access dashboard");
      }
      set({ token, user: me, loading: false });
      await get().loadData();
      return true;
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Login failed" });
      return false;
    }
  },

  loadData: async (options) => {
    const { token, statusFilter, pagination } = get();
    if (!token) return;
    const page = options?.page ?? pagination.page;
    const limit = options?.limit ?? pagination.limit;

    set({ loading: true, error: "" });
    try {
      const [users, ticketResult] = await Promise.all([
        getUsers(token),
        getTickets(token, { page, limit, status: statusFilter }),
      ]);
      set({
        users,
        tickets: ticketResult.tickets,
        pagination: ticketResult.pagination,
        loading: false,
      });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to load data" });
    }
  },

  createTicket: async (payload) => {
    const { token, tickets } = get();
    if (!token) return;
    set({ loading: true, error: "" });
    try {
      const created = await assignTicket(token, payload);
      if (created?._id && String(created._id).startsWith("local-")) {
        set({ tickets: [created, ...tickets], loading: false });
        return;
      }
      await get().loadData();
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to assign ticket" });
    }
  },

  loadRoomInspectionData: async (date, categoryKey) => {
    const { token } = get();
    if (!token) return;
    set({ loading: true, error: "" });
    try {
      const [dashboard, calendar, rooms] = await Promise.all([
        getRoomInspectionDashboard(token, date),
        getRoomInspectionCalendar(token, date.slice(0, 7)),
        categoryKey ? getRoomInspectionsByCategory(token, date, categoryKey) : Promise.resolve([]),
      ]);
      set({
        roomInspectionCategories: dashboard.categories,
        roomInspectionCalendar: calendar,
        roomInspectionRooms: rooms,
        loading: false,
      });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to load room inspection data" });
    }
  },

  logout: () =>
    set({
      token: "",
      user: null,
      users: [],
      tickets: [],
      roomInspectionCategories: [],
      roomInspectionRooms: [],
      roomInspectionCalendar: [],
      search: "",
      statusFilter: "all",
      pagination: {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      error: "",
    }),
    }),
    {
      name: "dashboard-store",
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
