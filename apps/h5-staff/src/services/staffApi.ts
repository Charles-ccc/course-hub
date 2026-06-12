import { httpClient } from "./http";
import { toApiBusinessError } from "./apiError";
import type {
  AuthSession,
  CommissionItem,
  CommissionSummary,
  PageResult,
  StaffProfile,
  StudentItem,
} from "../types/domain";
import type {
  ApiSuccess,
  LoginResponseDto,
  StaffCommissionPageDto,
  StaffCommissionSummaryDto,
  StaffProfileDto,
  StaffStudentPageDto,
} from "../types/api";

const unwrapData = <T>(payload: ApiSuccess<T> | T): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiSuccess<T>).data;
  }
  return payload as T;
};

export interface StaffLoginRequest {
  phone: string;
  password: string;
}

export interface StudentListQuery {
  page?: number;
  pageSize?: number;
  tab?: "all" | "due7" | "due" | "overdue";
}

export interface CommissionListQuery {
  page?: number;
  pageSize?: number;
}

export const staffApi = {
  async login(payload: StaffLoginRequest): Promise<AuthSession> {
    try {
      const { data } = await httpClient.post<
        ApiSuccess<LoginResponseDto> | LoginResponseDto
      >("/auth/phone/login", {
        phone: payload.phone,
        password: payload.password,
        clientType: "STAFF_H5",
      });
      const dto = unwrapData(data);

      return {
        token: dto.accessToken,
        refreshToken: dto.refreshToken,
        role: "STAFF",
        staffId: dto.staffId,
        staffProfile: {
          ...dto.staffProfile,
          status: "ACTIVE",
        },
      };
    } catch (error) {
      throw toApiBusinessError(error, "登录失败，请检查手机号或密码");
    }
  },

  async getSummary(): Promise<CommissionSummary> {
    try {
      const { data } = await httpClient.get<
        ApiSuccess<StaffCommissionSummaryDto> | StaffCommissionSummaryDto
      >("/staff/commission");
      return unwrapData(data);
    } catch (error) {
      throw toApiBusinessError(error, "提成汇总加载失败，请稍后重试");
    }
  },

  async getStudents(query: StudentListQuery): Promise<PageResult<StudentItem>> {
    try {
      const { data } = await httpClient.get<
        ApiSuccess<StaffStudentPageDto> | StaffStudentPageDto
      >("/staff/students", {
        params: {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 20,
          tab: query.tab ?? "all",
        },
      });
      return unwrapData(data);
    } catch (error) {
      throw toApiBusinessError(error, "学员列表加载失败，请稍后重试");
    }
  },

  async getCommissions(
    query: CommissionListQuery,
  ): Promise<PageResult<CommissionItem>> {
    try {
      const { data } = await httpClient.get<
        ApiSuccess<StaffCommissionPageDto> | StaffCommissionPageDto
      >("/staff/commissions", {
        params: {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 20,
        },
      });
      return unwrapData(data);
    } catch (error) {
      throw toApiBusinessError(error, "提成明细加载失败，请稍后重试");
    }
  },

  async getProfile(): Promise<StaffProfile> {
    try {
      const { data } = await httpClient.get<
        ApiSuccess<StaffProfileDto> | StaffProfileDto
      >("/staff/profile");
      return unwrapData(data);
    } catch (error) {
      throw toApiBusinessError(error, "个人信息加载失败，请稍后重试");
    }
  },
};
