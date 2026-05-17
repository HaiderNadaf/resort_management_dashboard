import axios from "axios";
import {
  AttendanceRecord,
  DailyTask,
  LiveTrackingEmployee,
  LiveTrackingSummary,
  RoomInspection,
  RoomInspectionCategoryCard,
  RoomInspectionDay,
  Ticket,
  TicketPagination,
  TrackingTrail,
  User,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function loginAdmin(phone: string, password: string) {
  const { data } = await api.post("/auth/login", { phone, password, role: "admin" });
  return data as { token: string };
}

export async function getMe(token: string): Promise<User> {
  try {
    const { data } = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.user as User;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch current user"));
  }
}

export async function getUsers(token: string): Promise<User[]> {
  try {
    const { data } = await api.get("/auth/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return (data.users || []) as User[];
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch users"));
  }
}

export async function getTickets(
  token: string,
  params?: { page?: number; limit?: number; status?: string }
): Promise<{ tickets: Ticket[]; pagination: TicketPagination }> {
  try {
    const { data } = await api.get("/tickets", {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        ...(params?.status && params.status !== "all" ? { status: params.status } : {}),
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    return {
      tickets: (data.tickets || []) as Ticket[],
      pagination: {
        page: data.page ?? 1,
        limit: data.limit ?? 10,
        totalCount: data.totalCount ?? data.count ?? 0,
        totalPages: data.totalPages ?? 1,
        hasNextPage: Boolean(data.hasNextPage),
        hasPrevPage: Boolean(data.hasPrevPage),
      },
    };
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch tickets"));
  }
}

export async function assignTicket(
  token: string,
  payload: { title: string; description: string; assignedTo: string; image: File }
) {
  try {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("assignedTo", payload.assignedTo);
    formData.append("image", payload.image);

    const { data } = await api.post("/tickets", formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to assign ticket"));
  }
}

export async function getRoomInspectionDashboard(
  token: string,
  date: string
): Promise<{
  inspectionDate: string;
  categories: RoomInspectionCategoryCard[];
  summary: { total: number; completed: number; occupied: number; inProgress: number; pending: number };
}> {
  const { data } = await api.get("/room-inspections/dashboard", {
    params: { date },
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    inspectionDate: data.inspectionDate ?? date,
    categories: (data.categories || []) as RoomInspectionCategoryCard[],
    summary: {
      total: Number(data.summary?.total || 0),
      completed: Number(data.summary?.completed || 0),
      occupied: Number(data.summary?.occupied || 0),
      inProgress: Number(data.summary?.inProgress || 0),
      pending: Number(data.summary?.pending || 0),
    },
  };
}

export async function getRoomInspectionCalendar(
  token: string,
  month: string,
  filters?: { color?: RoomInspectionDay["color"]; date?: string }
): Promise<RoomInspectionDay[]> {
  const { data } = await api.get("/room-inspections/calendar", {
    params: {
      month,
      ...(filters?.color ? { color: filters.color } : {}),
      ...(filters?.date ? { date: filters.date } : {}),
    },
    headers: { Authorization: `Bearer ${token}` },
  });
  return (data.days || []) as RoomInspectionDay[];
}

export async function getRoomInspectionsByCategory(
  token: string,
  date: string,
  categoryKey: string
): Promise<RoomInspection[]> {
  const { data } = await api.get("/room-inspections", {
    params: { date, category: categoryKey },
    headers: { Authorization: `Bearer ${token}` },
  });
  return (data.inspections || []) as RoomInspection[];
}

export async function getAttendanceRecords(
  token: string,
  params?: { date?: string }
): Promise<AttendanceRecord[]> {
  try {
    const { data } = await api.get("/attendance", {
      params: {
        date: params?.date,
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    return (data.attendance || []) as AttendanceRecord[];
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch attendance records"));
  }
}

export async function getLiveTracking(
  token: string,
  params?: { date?: string; includeAll?: boolean }
): Promise<{ dateKey: string; employees: LiveTrackingEmployee[]; summary: LiveTrackingSummary }> {
  try {
    const { data } = await api.get("/tracking/live", {
      params: {
        ...(params?.date ? { date: params.date } : {}),
        ...(params?.includeAll ? { all: "true" } : {}),
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    return {
      dateKey: data.dateKey as string,
      employees: (data.employees || []) as LiveTrackingEmployee[],
      summary: (data.summary || { total: 0, onShift: 0, withLocation: 0 }) as LiveTrackingSummary,
    };
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch live tracking"));
  }
}

export async function getTrackingTrail(
  token: string,
  params: { userId: string; date?: string }
): Promise<TrackingTrail> {
  try {
    const { data } = await api.get("/tracking/trail", {
      params: {
        userId: params.userId,
        ...(params.date ? { date: params.date } : {}),
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    return data as TrackingTrail;
  } catch (error) {
    throw new Error(apiErrorMessage(error, "Failed to fetch tracking trail"));
  }
}

export async function getAdminDailyTasks(
  token: string,
  params?: { date?: string; department?: string }
): Promise<DailyTask[]> {
  const { data } = await api.get("/daily-tasks/admin", {
    params: {
      ...(params?.date ? { date: params.date } : {}),
      ...(params?.department ? { department: params.department } : {}),
    },
    headers: { Authorization: `Bearer ${token}` },
  });
  return (data.tasks || []) as DailyTask[];
}
