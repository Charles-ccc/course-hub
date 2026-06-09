import dayjs from "dayjs";
import type {
  AdminCourseDto,
  DashboardHealthDto,
  GmvReportDto,
  InstitutionDto,
  LoginResponseDto,
  OverdueMonitorDto,
  SalesmanDto,
  SettlementRecordDto,
  SystemConfigDto,
} from "../types/api";

let institutionsMock: InstitutionDto[] = [
  {
    id: "org-1001",
    name: "欢乐学广州校区",
    socialCreditCode: "91440101MA5TEST001",
    settlementRate: 8.5,
    depositBalanceCents: 5000000,
    cumulativeGmvCents: 32000000,
    cumulativeServiceFeeCents: 2720000,
    status: "ACTIVE",
  },
  {
    id: "org-1002",
    name: "欢乐学深圳校区",
    socialCreditCode: "91440300MA5TEST002",
    settlementRate: 0,
    depositBalanceCents: 2000000,
    cumulativeGmvCents: 0,
    cumulativeServiceFeeCents: 0,
    status: "PENDING",
  },
  {
    id: "org-1003",
    name: "欢乐学佛山校区",
    socialCreditCode: "91440600MA5TEST003",
    settlementRate: 9.2,
    depositBalanceCents: 2800000,
    cumulativeGmvCents: 18000000,
    cumulativeServiceFeeCents: 1656000,
    status: "SUSPENDED",
  },
];

let coursesMock: AdminCourseDto[] = [
  {
    id: "course-1001",
    institutionId: "org-1001",
    institutionName: "欢乐学广州校区",
    name: "中考英语冲刺班",
    priceCents: 128000,
    status: "ONLINE",
    auditStatus: "APPROVED",
    createdAt: dayjs().subtract(20, "day").toISOString(),
  },
  {
    id: "course-1002",
    institutionId: "org-1002",
    institutionName: "欢乐学深圳校区",
    name: "初中数学提分营",
    priceCents: 98000,
    status: "OFFLINE",
    auditStatus: "PENDING_REVIEW",
    createdAt: dayjs().subtract(2, "day").toISOString(),
  },
];

let salesmenMock: SalesmanDto[] = [
  {
    id: "sales-1001",
    institutionId: "org-1001",
    name: "李明",
    phone: "13800000001",
    contractType: "EMPLOYEE",
    status: "ACTIVE",
    studentCount: 56,
    cumulativeCommissionCents: 265000,
  },
  {
    id: "sales-1002",
    institutionId: "org-1003",
    name: "张倩",
    phone: "13800000002",
    contractType: "AGENT",
    status: "DISABLED",
    studentCount: 20,
    cumulativeCommissionCents: 98000,
  },
];

let settlementsMock: SettlementRecordDto[] = [
  {
    id: "set-1001",
    institutionId: "org-1001",
    institutionName: "欢乐学广州校区",
    period: "2026-05",
    gmvCents: 1280000,
    serviceFeeCents: 108800,
    status: "PENDING",
  },
  {
    id: "set-1002",
    institutionId: "org-1003",
    institutionName: "欢乐学佛山校区",
    period: "2026-04",
    gmvCents: 990000,
    serviceFeeCents: 91080,
    status: "SETTLED",
    settledAt: dayjs().subtract(10, "day").toISOString(),
  },
];

let systemConfigMock: SystemConfigDto = {
  priceLimitCents: 200000,
  minAge: 8,
  maxAge: 18,
  zhimaEnabled: true,
};

export const mockLogin = async (payload: {
  username: string;
  password: string;
}): Promise<LoginResponseDto> => {
  if (payload.username !== "admin" || payload.password !== "admin123") {
    throw new Error("INVALID_CREDENTIALS");
  }

  return {
    accessToken: "dev-admin-token",
    refreshToken: "dev-admin-refresh-token",
    role: "PLATFORM_ADMIN",
    userId: "admin-1",
    displayName: "平台管理员",
  };
};

export const mockDashboardHealth = async (): Promise<DashboardHealthDto> => ({
  totalGmvCents: institutionsMock.reduce(
    (sum, item) => sum + item.cumulativeGmvCents,
    0,
  ),
  activeOrderCount: 182,
  repaymentRate: 96.8,
  overdueRate: 3.2,
  refundRate: 1.4,
  status: "HEALTHY",
  warningMetrics: [],
});

export const mockInstitutions = async (
  status?: InstitutionDto["status"] | "ALL",
): Promise<InstitutionDto[]> =>
  status && status !== "ALL"
    ? institutionsMock.filter((item) => item.status === status)
    : institutionsMock;

export const mockApproveInstitution = async (
  id: string,
  settlementRate: number,
): Promise<void> => {
  institutionsMock = institutionsMock.map((item) =>
    item.id === id ? { ...item, settlementRate, status: "ACTIVE" } : item,
  );
};

export const mockSuspendInstitution = async (
  id: string,
  reason: string,
): Promise<void> => {
  void reason;
  institutionsMock = institutionsMock.map((item) =>
    item.id === id ? { ...item, status: "SUSPENDED" } : item,
  );
};

export const mockCourses = async (
  auditStatus: "APPROVED" | "PENDING_REVIEW",
): Promise<AdminCourseDto[]> =>
  coursesMock.filter((item) => item.auditStatus === auditStatus);

export const mockApproveCourse = async (id: string): Promise<void> => {
  coursesMock = coursesMock.map((item) =>
    item.id === id
      ? { ...item, auditStatus: "APPROVED", status: "ONLINE" }
      : item,
  );
};

export const mockRejectCourse = async (
  id: string,
  reason: string,
): Promise<void> => {
  void reason;
  coursesMock = coursesMock.map((item) =>
    item.id === id
      ? { ...item, auditStatus: "REJECTED", status: "OFFLINE" }
      : item,
  );
};

export const mockOfflineCourse = async (id: string): Promise<void> => {
  coursesMock = coursesMock.map((item) =>
    item.id === id ? { ...item, status: "OFFLINE" } : item,
  );
};

export const mockSalesmen = async (
  status?: SalesmanDto["status"] | "ALL",
): Promise<SalesmanDto[]> =>
  status && status !== "ALL"
    ? salesmenMock.filter((item) => item.status === status)
    : salesmenMock;

export const mockCreateSalesman = async (payload: {
  institutionId: string;
  username: string;
  password: string;
  name: string;
  phone: string;
  contractType: SalesmanDto["contractType"];
}): Promise<void> => {
  void payload.username;
  void payload.password;
  salesmenMock = [
    {
      id: `sales-${Date.now()}`,
      institutionId: payload.institutionId,
      name: payload.name,
      phone: payload.phone,
      contractType: payload.contractType,
      status: "ACTIVE",
      studentCount: 0,
      cumulativeCommissionCents: 0,
    },
    ...salesmenMock,
  ];
};

export const mockDisableSalesman = async (id: string): Promise<void> => {
  salesmenMock = salesmenMock.map((item) =>
    item.id === id ? { ...item, status: "DISABLED" } : item,
  );
};

export const mockGmvReport = async (): Promise<GmvReportDto> => ({
  month: dayjs().format("YYYY-MM"),
  totalGmvCents: 3650000,
  totalServiceFeeCents: 299880,
  items: institutionsMock.map((item) => ({
    institutionId: item.id,
    institutionName: item.name,
    gmvCents: Math.floor(item.cumulativeGmvCents / 12),
    serviceFeeCents: Math.floor(item.cumulativeServiceFeeCents / 12),
  })),
});

export const mockOverdueMonitor = async (): Promise<OverdueMonitorDto> => ({
  overdueRate: 3.2,
  overdueInstallments: 14,
  totalInstallments: 437,
});

export const mockSettlements = async (): Promise<SettlementRecordDto[]> =>
  settlementsMock;

export const mockExecuteSettlement = async (id: string): Promise<void> => {
  settlementsMock = settlementsMock.map((item) =>
    item.id === id
      ? { ...item, status: "SETTLED", settledAt: dayjs().toISOString() }
      : item,
  );
};

export const mockSystemConfig = async (): Promise<SystemConfigDto> =>
  systemConfigMock;

export const mockUpdateSystemConfig = async (
  payload: SystemConfigDto,
): Promise<void> => {
  systemConfigMock = payload;
};
