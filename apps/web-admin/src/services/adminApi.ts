import type { ApiSuccess } from "@wangke/web-shared";
import type {
  AdminCourse,
  AuthSession,
  ContractType,
  GmvReport,
  HealthMetrics,
  Institution,
  OverdueMonitor,
  Salesman,
  SalesmanStatus,
  SettlementRecord,
  SystemConfig,
} from "../types/domain";
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
import { toApiBusinessError } from "./apiError";
import {
  adaptCourse,
  adaptGmvReport,
  adaptHealthMetrics,
  adaptInstitution,
  adaptLoginResponse,
  adaptOverdueMonitor,
  adaptSalesman,
  adaptSettlement,
  adaptSystemConfig,
} from "./adminAdapters";
import { httpClient } from "./http";
import {
  mockApproveCourse,
  mockApproveInstitution,
  mockCourses,
  mockDashboardHealth,
  mockExecuteSettlement,
  mockGmvReport,
  mockInstitutions,
  mockLogin,
  mockOverdueMonitor,
  mockRejectCourse,
  mockSalesmen,
  mockSettlements,
  mockSuspendInstitution,
  mockSystemConfig,
  mockUpdateSystemConfig,
  mockCreateSalesman,
  mockDisableSalesman,
  mockOfflineCourse,
} from "./mockData";

const useMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === "true";

const unwrap = <T>(response: ApiSuccess<T>): T => response.data;

export const adminApi = {
  async login(payload: {
    username: string;
    password: string;
  }): Promise<AuthSession> {
    try {
      if (useMock) {
        return adaptLoginResponse(await mockLogin(payload));
      }
      const response = await httpClient.post<ApiSuccess<LoginResponseDto>>(
        "/admin/auth/login",
        payload,
      );
      return adaptLoginResponse(unwrap(response.data));
    } catch (error) {
      throw toApiBusinessError(error, "登录失败，请稍后重试");
    }
  },

  async getHealthMetrics(): Promise<HealthMetrics> {
    try {
      if (useMock) {
        return adaptHealthMetrics(await mockDashboardHealth());
      }
      const response = await httpClient.get<ApiSuccess<DashboardHealthDto>>(
        "/admin/dashboard/health",
      );
      return adaptHealthMetrics(unwrap(response.data));
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async getInstitutions(
    status?: Institution["status"] | "ALL",
  ): Promise<Institution[]> {
    try {
      if (useMock) {
        return (await mockInstitutions(status)).map(adaptInstitution);
      }
      const response = await httpClient.get<ApiSuccess<InstitutionDto[]>>(
        "/admin/institutions",
        { params: status && status !== "ALL" ? { status } : undefined },
      );
      return unwrap(response.data).map(adaptInstitution);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async approveInstitution(id: string, settlementRate: number): Promise<void> {
    return adminApi.updateInstitutionStatus(id, {
      type: "approve",
      settlementRate,
    });
  },

  async updateInstitutionStatus(
    id: string,
    payload:
      | { type: "approve"; settlementRate: number }
      | { type: "suspend"; reason: string },
  ): Promise<void> {
    try {
      if (useMock) {
        if (payload.type === "approve") {
          await mockApproveInstitution(id, payload.settlementRate);
        } else {
          await mockSuspendInstitution(id, payload.reason);
        }
        return;
      }
      if (payload.type === "approve") {
        await httpClient.post(`/admin/institutions/${id}/approve`, {
          settlementRate: payload.settlementRate,
        });
      } else {
        await httpClient.post(`/admin/institutions/${id}/suspend`, {
          reason: payload.reason,
        });
      }
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async createInstitution(payload: {
    name: string;
    socialCreditCode: string;
    depositBalanceCents?: number;
  }): Promise<void> {
    try {
      if (useMock) {
        // TODO: Add mock
        return;
      }
      await httpClient.post("/admin/institutions", payload);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async updateInstitution(
    id: string,
    payload: {
      name?: string;
      socialCreditCode?: string;
      depositBalanceCents?: number;
    },
  ): Promise<void> {
    try {
      if (useMock) {
        // TODO: Add mock
        return;
      }
      await httpClient.put(`/admin/institutions/${id}`, payload);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async deleteInstitution(id: string): Promise<void> {
    try {
      if (useMock) {
        // TODO: Add mock
        return;
      }
      await httpClient.delete(`/admin/institutions/${id}`);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async getCourses(tab: "APPROVED" | "PENDING_REVIEW"): Promise<AdminCourse[]> {
    try {
      if (useMock) {
        return (await mockCourses(tab)).map(adaptCourse);
      }
      const response = await httpClient.get<ApiSuccess<AdminCourseDto[]>>(
        "/admin/courses",
        { params: { auditStatus: tab } },
      );
      return unwrap(response.data).map(adaptCourse);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async approveCourse(id: string): Promise<void> {
    try {
      if (useMock) {
        await mockApproveCourse(id);
        return;
      }
      await httpClient.post(`/admin/courses/${id}/approve`);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async rejectCourse(id: string, reason: string): Promise<void> {
    try {
      if (useMock) {
        await mockRejectCourse(id, reason);
        return;
      }
      await httpClient.post(`/admin/courses/${id}/reject`, { reason });
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async offlineCourse(id: string): Promise<void> {
    try {
      if (useMock) {
        await mockOfflineCourse(id);
        return;
      }
      await httpClient.post(`/admin/courses/${id}/offline`);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async createCourse(payload: {
    institutionId: string;
    name: string;
    description: string;
    instructorInfo: string;
    priceCents: number;
    periodCount: number;
  }): Promise<void> {
    try {
      if (useMock) {
        // TODO: Add mock
        return;
      }
      await httpClient.post("/admin/courses", payload);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async updateCourse(
    id: string,
    payload: {
      name?: string;
      description?: string;
      instructorInfo?: string;
      priceCents?: number;
      periodCount?: number;
    },
  ): Promise<void> {
    try {
      if (useMock) {
        // TODO: Add mock
        return;
      }
      await httpClient.put(`/admin/courses/${id}`, payload);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async deleteCourse(id: string): Promise<void> {
    try {
      if (useMock) {
        // TODO: Add mock
        return;
      }
      await httpClient.delete(`/admin/courses/${id}`);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async getSalesmen(status?: SalesmanStatus | "ALL"): Promise<Salesman[]> {
    try {
      if (useMock) {
        return (await mockSalesmen(status)).map(adaptSalesman);
      }
      const response = await httpClient.get<ApiSuccess<SalesmanDto[]>>(
        "/admin/salesmen",
        { params: status && status !== "ALL" ? { status } : undefined },
      );
      return unwrap(response.data).map(adaptSalesman);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async createSalesman(payload: {
    institutionId: string;
    username: string;
    password: string;
    name: string;
    phone: string;
    contractType: ContractType;
  }): Promise<void> {
    try {
      if (useMock) {
        await mockCreateSalesman(payload);
        return;
      }
      await httpClient.post("/admin/salesmen", payload);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async disableSalesman(id: string): Promise<void> {
    try {
      if (useMock) {
        await mockDisableSalesman(id);
        return;
      }
      await httpClient.post(`/admin/salesmen/${id}/disable`);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async getReports(): Promise<{ gmv: GmvReport; overdue: OverdueMonitor }> {
    try {
      if (useMock) {
        const [gmv, overdue] = await Promise.all([
          mockGmvReport(),
          mockOverdueMonitor(),
        ]);
        return {
          gmv: adaptGmvReport(gmv),
          overdue: adaptOverdueMonitor(overdue),
        };
      }
      const [gmvResponse, overdueResponse] = await Promise.all([
        httpClient.get<ApiSuccess<GmvReportDto>>("/admin/reports/gmv"),
        httpClient.get<ApiSuccess<OverdueMonitorDto>>(
          "/admin/reports/overdue-monitor",
        ),
      ]);
      return {
        gmv: adaptGmvReport(unwrap(gmvResponse.data)),
        overdue: adaptOverdueMonitor(unwrap(overdueResponse.data)),
      };
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async getSettlements(): Promise<SettlementRecord[]> {
    try {
      if (useMock) {
        return (await mockSettlements()).map(adaptSettlement);
      }
      const response =
        await httpClient.get<ApiSuccess<SettlementRecordDto[]>>(
          "/admin/settlements",
        );
      return unwrap(response.data).map(adaptSettlement);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async executeSettlement(id: string): Promise<void> {
    try {
      if (useMock) {
        await mockExecuteSettlement(id);
        return;
      }
      await httpClient.post(`/admin/settlements/${id}/execute`);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async getSystemConfig(): Promise<SystemConfig> {
    try {
      if (useMock) {
        return adaptSystemConfig(await mockSystemConfig());
      }
      const response = await httpClient.get<ApiSuccess<SystemConfigDto>>(
        "/admin/system-config",
      );
      return adaptSystemConfig(unwrap(response.data));
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },

  async updateSystemConfig(payload: SystemConfig): Promise<void> {
    try {
      if (useMock) {
        await mockUpdateSystemConfig(payload);
        return;
      }
      await httpClient.put("/admin/system-config", payload);
    } catch (error) {
      throw toApiBusinessError(error);
    }
  },
};
