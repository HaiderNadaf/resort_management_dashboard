import axios from "axios";
import { RoomInspection, RoomInspectionCategoryCard, RoomInspectionDay, Ticket, TicketPagination, User } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

const mockUsers: User[] = [
  { _id: "u1", name: "Emily Clark", email: "emily@company.com", role: "admin", isMainAdmin: true },
  { _id: "u2", name: "Alex Rivera", role: "employee" },
  { _id: "u3", name: "Samira Jones", role: "employee" },
  { _id: "u4", name: "David Chen", role: "employee" },
];

const mockTickets: Ticket[] = [
  {
    _id: "tkt-1042",
    title: "VPN Access Failing",
    description: "Unable to connect to corporate VPN.",
    status: "in_progress",
    imageUrl: "https://picsum.photos/seed/tkt1042/120/80",
    completionImageUrl: null,
    assignedTo: { _id: "u2", name: "Alex Rivera" },
    createdBy: { _id: "u1", name: "Emily Clark" },
  },
  {
    _id: "tkt-1043",
    title: "New Monitor Request",
    description: "Requesting a second monitor for workstation.",
    status: "pending",
    imageUrl: "https://picsum.photos/seed/tkt1043/120/80",
    completionImageUrl: null,
    assignedTo: null,
    createdBy: { _id: "u1", name: "Emily Clark" },
  },
  {
    _id: "tkt-1044",
    title: "Software License Renewal",
    description: "Adobe CC license renewal required.",
    status: "completed",
    imageUrl: "https://picsum.photos/seed/tkt1044/120/80",
    completionImageUrl: "https://picsum.photos/seed/tkt1044done/120/80",
    assignedTo: { _id: "u3", name: "Samira Jones" },
    createdBy: { _id: "u1", name: "Emily Clark" },
  },
];

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
  } catch {
    return mockUsers[0];
  }
}

export async function getUsers(token: string): Promise<User[]> {
  try {
    const { data } = await api.get("/auth/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return (data.users || []) as User[];
  } catch {
    return mockUsers;
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
  } catch {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    const sliced = mockTickets.slice(start, end);
    const totalPages = Math.max(Math.ceil(mockTickets.length / limit), 1);
    return {
      tickets: sliced,
      pagination: {
        page,
        limit,
        totalCount: mockTickets.length,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
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
  } catch {
    return {
      _id: `local-${Date.now()}`,
      title: payload.title,
      description: payload.description,
      status: "pending",
      imageUrl: URL.createObjectURL(payload.image),
      completionImageUrl: null,
      assignedTo: mockUsers.find((user) => user._id === payload.assignedTo) ?? null,
    } as Ticket;
  }
}

export async function getRoomInspectionDashboard(
  token: string,
  date: string
): Promise<{ inspectionDate: string; categories: RoomInspectionCategoryCard[] }> {
  const { data } = await api.get("/room-inspections/dashboard", {
    params: { date },
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    inspectionDate: data.inspectionDate ?? date,
    categories: (data.categories || []) as RoomInspectionCategoryCard[],
  };
}

export async function getRoomInspectionCalendar(token: string, month: string): Promise<RoomInspectionDay[]> {
  const { data } = await api.get("/room-inspections/calendar", {
    params: { month },
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
