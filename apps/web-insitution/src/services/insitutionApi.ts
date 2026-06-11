import dayjs from "dayjs";
import { httpClient } from "./http";
import {
  ApiBusinessError,
  BUSINESS_ERROR_CODES,
  toApiBusinessError,
} from "./apiError";
import {
  adaptCourse,
  adaptInsitutionProfile,
  adaptLoginResponse,
  adaptOrder,
  adaptOverduePeriod,
  adaptQaQuestion,
  adaptSettlementRecord,
} from "./insitutionAdapters";
import {
  coursesMock,
  ordersMock,
  overduePeriodsMock,
  profileMock,
  qaMock,
  settlementsMock,
} from "./mockData";
import type {
  AuthSession,
  Course,
  InsitutionProfile,
  Order,
  OrderStatus,
  OverduePeriod,
  QaQuestion,
  SettlementRecord,
} from "../types/domain";
import type {
  ApiSuccess,
  CourseDto,
  CoursesPageDto,
  InsitutionDepositDto,
  LoginResponseDto,
  OrderDto,
  OrdersPageDto,
  OverduePeriodDto,
  OverduesPageDto,
  QaQuestionDto,
  QuestionsPageDto,
  SettlementRecordDto,
  SettlementsPageDto,
} from "../types/api";

const useMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === "true";

const wait = async (ms = 300): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

let mutableCourses = [...coursesMock];
let mutableOverdues = [...overduePeriodsMock];
let mutableQa = [...qaMock];

const unwrapData = <T>(payload: ApiSuccess<T> | T): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiSuccess<T>).data;
  }

  return payload as T;
};

const unwrapItems = <T>(
  payload: ApiSuccess<{ items: T[] }> | { items: T[] } | T[],
): T[] => {
  const data = unwrapData<{ items: T[] } | T[]>(payload);
  return Array.isArray(data) ? data : data.items;
};

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface CreateCourseRequest {
  name: string;
  description: string;
  instructorInfo: string;
  priceYuan: number;
  periodCount: number;
}

export const insitutionApi = {
  async login(payload: LoginRequest): Promise<AuthSession> {
    if (useMock) {
      await wait();
      if (payload.phone.length < 6 || payload.password.length < 6) {
        throw new ApiBusinessError(
          BUSINESS_ERROR_CODES.INVALID_CREDENTIALS,
          "手机号或密码错误",
        );
      }
      return {
        token: "dev-insitution-token",
        refreshToken: "dev-insitution-refresh-token",
        role: "INSITUTION_ADMIN",
        orgId: profileMock.orgId ?? "org-1001",
        orgName: profileMock.orgName ?? "欢乐学示例机构",
      };
    }

    try {
      const { data } = await httpClient.post<
        ApiSuccess<LoginResponseDto> | LoginResponseDto
      >("/auth/phone/login", {
        phone: payload.phone,
        password: payload.password,
        clientType: "INSITUTION_WEB",
      });
      return adaptLoginResponse(unwrapData(data));
    } catch (error) {
      throw toApiBusinessError(error, "手机号或密码错误");
    }
  },

  async getProfile(): Promise<InsitutionProfile> {
    if (useMock) {
      await wait();
      return adaptInsitutionProfile(profileMock);
    }
    try {
      const { data } = await httpClient.get<
        ApiSuccess<InsitutionDepositDto> | InsitutionDepositDto
      >("/insitution/deposit");
      return adaptInsitutionProfile(unwrapData(data));
    } catch (error) {
      throw toApiBusinessError(error, "机构资料获取失败，请稍后重试");
    }
  },

  async getOrders(status?: OrderStatus): Promise<Order[]> {
    if (useMock) {
      await wait();
      const items = !status
        ? ordersMock
        : ordersMock.filter((order) => order.status === status);
      return items.map(adaptOrder);
    }
    try {
      const { data } = await httpClient.get<
        ApiSuccess<OrdersPageDto> | OrdersPageDto | OrdersPageDto["items"]
      >("/insitution/orders", {
        params: { status },
      });
      return unwrapItems<OrderDto>(data).map(adaptOrder);
    } catch (error) {
      throw toApiBusinessError(error, "订单列表获取失败，请稍后重试");
    }
  },

  async getCourses(): Promise<Course[]> {
    if (useMock) {
      await wait();
      return mutableCourses.map(adaptCourse);
    }
    try {
      const { data } = await httpClient.get<
        ApiSuccess<CoursesPageDto> | CoursesPageDto | CourseDto[]
      >("/insitution/courses");
      return unwrapItems<CourseDto>(data).map(adaptCourse);
    } catch (error) {
      throw toApiBusinessError(error, "课程列表获取失败，请稍后重试");
    }
  },

  async createCourse(payload: CreateCourseRequest): Promise<void> {
    if (useMock) {
      await wait();
      if (payload.priceYuan > 20000) {
        throw new ApiBusinessError(
          BUSINESS_ERROR_CODES.PRICE_LIMIT_EXCEEDED,
          "课程定价超出平台允许的最高金额，请调低定价后重试。",
        );
      }
      mutableCourses = [
        {
          id: `course-${Date.now()}`,
          name: payload.name,
          description: payload.description,
          instructorInfo: payload.instructorInfo,
          priceCents: payload.priceYuan * 100,
          periodCount: payload.periodCount,
          status: "OFFLINE",
        },
        ...mutableCourses,
      ];
      return;
    }

    try {
      await httpClient.post("/insitution/courses", {
        name: payload.name,
        description: payload.description,
        instructorInfo: payload.instructorInfo,
        priceCents: payload.priceYuan * 100,
        periodCount: payload.periodCount,
      });
    } catch (error) {
      throw toApiBusinessError(error, "创建课程失败，请稍后重试");
    }
  },

  async updateCourseStatus(
    courseId: string,
    status: "ONLINE" | "OFFLINE",
  ): Promise<void> {
    if (useMock) {
      await wait();
      mutableCourses = mutableCourses.map((course) =>
        course.id === courseId ? { ...course, status } : course,
      );
      return;
    }

    try {
      await httpClient.patch(`/insitution/courses/${courseId}/status`, {
        status,
      });
    } catch (error) {
      throw toApiBusinessError(error, "课程状态更新失败，请稍后重试");
    }
  },

  async getOverdues(): Promise<OverduePeriod[]> {
    if (useMock) {
      await wait();
      return mutableOverdues
        .filter((item) => item.status === "OVERDUE")
        .map(adaptOverduePeriod);
    }

    try {
      const { data } = await httpClient.get<
        ApiSuccess<OverduesPageDto> | OverduesPageDto | OverduesPageDto["items"]
      >("/insitution/overdue/periods");
      return unwrapItems<OverduePeriodDto>(data).map(adaptOverduePeriod);
    } catch (error) {
      throw toApiBusinessError(error, "逾期列表获取失败，请稍后重试");
    }
  },

  async writeoffOverdue(id: string, remark: string): Promise<void> {
    if (useMock) {
      await wait();
      mutableOverdues = mutableOverdues.map((item) =>
        item.id === id ? { ...item, status: "WRITTEN_OFF" } : item,
      );
      return;
    }

    try {
      await httpClient.post(`/insitution/overdue/periods/${id}/writeoff`, {
        remark,
      });
    } catch (error) {
      throw toApiBusinessError(error, "核销失败，请稍后重试");
    }
  },

  async getSettlements(): Promise<SettlementRecord[]> {
    if (useMock) {
      await wait();
      return settlementsMock.map(adaptSettlementRecord);
    }

    try {
      const { data } = await httpClient.get<
        | ApiSuccess<SettlementsPageDto>
        | SettlementsPageDto
        | SettlementsPageDto["items"]
      >("/insitution/settlements");
      return unwrapItems<SettlementRecordDto>(data).map(adaptSettlementRecord);
    } catch (error) {
      throw toApiBusinessError(error, "结算记录获取失败，请稍后重试");
    }
  },

  async getQuestions(onlyPending: boolean): Promise<QaQuestion[]> {
    if (useMock) {
      await wait();
      const items = !onlyPending
        ? mutableQa
        : mutableQa.filter((item) => !item.replied);
      return items.map(adaptQaQuestion);
    }

    try {
      const { data } = await httpClient.get<
        | ApiSuccess<QuestionsPageDto>
        | QuestionsPageDto
        | QuestionsPageDto["items"]
      >("/insitution/questions", {
        params: { onlyPending },
      });
      return unwrapItems<QaQuestionDto>(data).map(adaptQaQuestion);
    } catch (error) {
      throw toApiBusinessError(error, "答疑列表获取失败，请稍后重试");
    }
  },

  async replyQuestion(id: string, content: string): Promise<void> {
    if (useMock) {
      await wait();
      mutableQa = mutableQa.map((item) =>
        item.id === id
          ? {
              ...item,
              replied: true,
              replyContent: content,
              repliedAt: dayjs().toISOString(),
            }
          : item,
      );
      return;
    }

    try {
      await httpClient.post(`/insitution/questions/${id}/reply`, { content });
    } catch (error) {
      throw toApiBusinessError(error, "回复失败，请稍后重试");
    }
  },
};
