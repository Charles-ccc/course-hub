export type Role = "STAFF";

export interface StaffProfile {
  name: string;
  phone: string;
  staffId: string;
  contractType: "EMPLOYEE" | "AGENT";
  groupName?: string;
  status: "ACTIVE" | "DISABLED";
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  role: Role;
  staffId: string;
  staffProfile: StaffProfile;
}

export interface CommissionSummary {
  settledCents: number;
  pendingCents: number;
  heldCents: number;
}

export interface CommissionItem {
  id: string;
  type: "CLOSING" | "PERFORMANCE";
  periodNo?: number;
  status: "PENDING" | "SETTLED" | "HELD" | "CLAWED_BACK";
  amountCents: number;
  studentName: string;
  courseName: string;
  createdAt: string;
}

export interface StudentItem {
  id: string;
  name: string;
  phone: string;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE";
  progressFinishedCount: number;
  progressTotalCount: number;
  nextDueDate?: string;
  overdueDays: number;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
