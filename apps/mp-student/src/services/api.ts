import Taro from "@tarojs/taro";
import { mockStudentApi } from "./mock";

const BASE_URL = process.env.TARO_APP_API_URL || "http://localhost:3000";
const useMockApi =
  process.env.NODE_ENV === "development" ||
  process.env.TARO_APP_USE_FRONTEND_MOCK === "true";

function getToken() {
  return Taro.getStorageSync("token") || "";
}

async function request<T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  data?: any,
): Promise<T> {
  const res = await Taro.request({
    url: `${BASE_URL}${url}`,
    method,
    data,
    header: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (res.data.code !== 200) {
    throw new Error(res.data.message || "请求失败");
  }
  return res.data.data;
}

const realApi = {
  // 认证 — OAuth（用于静默自动登录）
  wechatLogin: (
    code: string,
    referrerStaffId?: string,
    referrerStudentId?: string,
  ) =>
    request("POST", "/api/v1/auth/wechat/login", {
      code,
      appType: "student",
      referrerStaffId,
      referrerStudentId,
    }),

  alipayLogin: (
    authCode: string,
    referrerStaffId?: string,
    referrerStudentId?: string,
  ) =>
    request("POST", "/api/v1/auth/alipay/login", {
      authCode,
      appType: "student",
      referrerStaffId,
      referrerStudentId,
    }),

  // 认证 — 手机号体系
  sendSmsCode: (phone: string, type: "register" | "reset") =>
    request("POST", "/api/v1/auth/sms/send", { phone, type }),

  registerByPhone: (
    phone: string,
    code: string,
    password: string,
    orgCode: string,
  ) =>
    request("POST", "/api/v1/auth/phone/register", {
      phone,
      code,
      password,
      orgCode,
    }),

  loginByPhone: (phone: string, password: string) =>
    request("POST", "/api/v1/auth/phone/login", { phone, password }),

  resetPassword: (phone: string, code: string, newPassword: string) =>
    request("POST", "/api/v1/auth/phone/reset-password", {
      phone,
      code,
      newPassword,
    }),

  // 实名
  verifyRealname: (data: { name: string; idNo: string; phone: string }) =>
    request("POST", "/api/v1/users/realname", data),

  bindPhone: (phone: string, smsCode: string) =>
    request("POST", "/api/v1/users/bind-phone", { phone, smsCode }),

  getProfile: () => request("GET", "/api/v1/users/profile"),

  // 课程
  getCourses: (keyword?: string, page = 1) =>
    request(
      "GET",
      `/api/v1/courses?keyword=${keyword || ""}&page=${page}&size=20`,
    ),

  getCourseDetail: (id: string) => request("GET", `/api/v1/courses/${id}`),

  // 视频
  getCourseVideos: (courseId: string) =>
    request("GET", `/api/v1/courses/${courseId}/videos`),

  getVideoUrl: (videoId: string) =>
    request<string>("GET", `/api/v1/courses/videos/${videoId}/url`),

  // 教师
  getTeacherInfo: (courseId: string) =>
    request("GET", `/api/v1/courses/${courseId}/teacher`),

  // 订单
  createOrder: (courseId: string) =>
    request("POST", "/api/v1/orders", { courseId }),

  getOrders: () => request("GET", "/api/v1/orders"),

  getOrderDetail: (id: string) => request("GET", `/api/v1/orders/${id}`),

  getInstallments: (orderId: string) =>
    request("GET", `/api/v1/orders/${orderId}/installments`),

  // 签约（法大大 / e签宝）
  signWithFadadada: (orderId: string) =>
    request("POST", `/api/v1/orders/${orderId}/sign/fadadada`),

  signWithEqianbao: (orderId: string) =>
    request("POST", `/api/v1/orders/${orderId}/sign/eqianbao`),

  checkSignStatus: (orderId: string) =>
    request("GET", `/api/v1/orders/${orderId}/sign/status`),

  // 信用（保留，供后端兼容）
  creditAuthorize: (orderId: string) =>
    request("POST", "/api/v1/credit/authorize", {
      orderId,
      scenario: "INSTALLMENT_COURSE",
    }),

  signCreditAgreement: (orderId: string) =>
    request("POST", "/api/v1/credit/sign-agreement", { orderId }),

  // 学习
  getLearningProgress: (orderId: string) =>
    request("GET", `/api/v1/learning/${orderId}/progress`),

  checkin: (orderId: string, coursePeriod: number, faceToken: string) =>
    request("POST", "/api/v1/learning/checkin", {
      orderId,
      coursePeriod,
      faceToken,
    }),

  // 拉新（保留路由，前端入口已移除）
  generateInviteLink: () => request("POST", "/api/v1/referral/invite"),

  getReferralRewards: () => request("GET", "/api/v1/referral/rewards"),
};

export const api = useMockApi ? mockStudentApi : realApi;
