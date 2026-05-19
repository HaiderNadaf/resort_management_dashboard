export type UserRole = "admin" | "employee";

export type TicketStatus = "pending" | "in_progress" | "completed";

export type RoomInspectionStatus = "pending" | "in_progress" | "completed" | "occupied";

export type User = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string | null;
  role: UserRole;
  isMainAdmin?: boolean;
  department?: string | null;
};

export type Ticket = {
  _id: string;
  title: string;
  description: string;
  status: TicketStatus;
  imageUrl?: string | null;
  completionImageUrl?: string | null;
  assignedTo?: Pick<User, "_id" | "name" | "department"> | null;
  createdBy?: Pick<User, "_id" | "name" | "department"> | null;
  assignmentHistory?: Array<{
    assignedBy?: Pick<User, "_id" | "name" | "department"> | null;
    assignedTo?: Pick<User, "_id" | "name" | "department"> | null;
    department?: string | null;
    assignedAt?: string;
  }>;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TicketPagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type RoomInspectionCategoryCard = {
  categoryKey: string;
  categoryName: string;
  totalRooms: number;
  completedRooms: number;
  inProgressRooms?: number;
  pendingRooms?: number;
  occupiedRooms?: number;
  progress: string;
  assignedTo?: Pick<User, "_id" | "name" | "department"> | null;
};

export type RoomInspectionDay = {
  date: string;
  total: number;
  completed: number;
  color: "green" | "yellow" | "red";
};

export type RoomInspection = {
  _id: string;
  inspectionDate: string;
  categoryKey: string;
  categoryName: string;
  roomNumber: number;
  roomLabel: string;
  department?: string;
  status: RoomInspectionStatus;
  assignedBy?: Pick<User, "_id" | "name" | "department"> | null;
  assignedTo?: Pick<User, "_id" | "name" | "department"> | null;
  assignmentHistory?: Array<{
    assignedBy?: Pick<User, "_id" | "name" | "department"> | null;
    assignedAt?: string;
  }>;
  notes?: string;
  progressImageUrl?: string | null;
  checklist?: Array<{ label: string; isChecked: boolean }>;
  createdAt?: string;
  completedAt?: string | null;
};

export type AttendanceRecord = {
  _id: string;
  dateKey: string;
  user?: Pick<User, "_id" | "name" | "phone" | "department"> | null;
  checkIn?: {
    latitude: number;
    longitude: number;
    capturedAt: string;
    capturedAtLabel?: string;
  } | null;
  checkOut?: {
    latitude: number;
    longitude: number;
    capturedAt: string;
    capturedAtLabel?: string;
  } | null;
};

export type LocationPingPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  capturedAt: string;
  capturedAtLabel?: string;
};

export type LiveTrackingEmployee = {
  user: Pick<User, "_id" | "name" | "phone" | "department">;
  onShift: boolean;
  status: "on_shift" | "checked_out";
  checkIn?: {
    latitude: number;
    longitude: number;
    capturedAt: string;
    capturedAtLabel?: string;
  } | null;
  checkOut?: {
    latitude: number;
    longitude: number;
    capturedAt: string;
    capturedAtLabel?: string;
  } | null;
  lastPing?: LocationPingPoint | null;
  displayLocation?: (LocationPingPoint & { source?: "gps" | "check_in" }) | null;
};

export type LiveTrackingSummary = {
  total: number;
  onShift: number;
  withLocation: number;
};

export type TrackingTrail = {
  dateKey: string;
  user: Pick<User, "_id" | "name" | "phone" | "department">;
  pings: LocationPingPoint[];
};

export type DailyTask = {
  _id: string;
  taskTitle: string;
  status: "started" | "completed";
  dateKey: string;
  startTime: string;
  endTime?: string | null;
  startImageUrl: string;
  startVoiceUrl?: string | null;
  endImageUrl?: string | null;
  department: string;
  employee?: Pick<User, "_id" | "name" | "phone" | "department"> | null;
};
