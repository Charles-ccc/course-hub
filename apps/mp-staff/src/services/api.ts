import Taro from "@tarojs/taro";
import { mockStaffApi } from "./mock";

const BASE_URL = process.env.TARO_APP_API_URL || "http://localhost:3000";
const useMockApi = process.env.TARO_APP_USE_FRONTEND_MOCK === "true";

function getToken() {
  return Taro.getStorageSync("staff_token") || "";
}

async function request<T = any>(
  method: "GET" | "POST",
  url: string,
  data?: Record<string, any>,
): Promise<T> {
  const res = await Taro.request({
    url: `${BASE_URL}${url}`,
    method,
    data,
    header: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (res.data.code !== 200) {
    throw new Error(res.data.message || "请求失败");
  }

  return res.data.data as T;
}

const normalizeLoginResult = (payload: any) => ({
  token: payload.token,
  staff: payload.staff ||
    payload.student || {
      id: Taro.getStorageSync("staff_id") || "staff-unknown",
      name: "演示业务员",
      phone: "",
      contractType: "AGENT",
    },
  isNew: !!payload.isNew,
});

const persistStaffSession = (auth: {
  token: string;
  staff: any;
  isNew: boolean;
}) => {
  Taro.setStorageSync("staff_token", auth.token);
  Taro.setStorageSync("staff_id", auth.staff?.id || "");
  Taro.setStorageSync("staff_profile", auth.staff || null);
  return auth;
};

const realStaffApi = {
  async loginWithWechat(code: string) {
    const payload = await request("POST", "/api/v1/auth/wechat/login", {
      code,
      appType: "staff",
    });
    return normalizeLoginResult(payload);
  },

  async loginWithAlipay(authCode: string) {
    const payload = await request("POST", "/api/v1/auth/alipay/login", {
      authCode,
      appType: "staff",
    });
    return normalizeLoginResult(payload);
  },

  getCommissionDashboard: () => request("GET", "/api/v1/staff/commission"),

  getStudents: (page = 1) =>
    request("GET", `/api/v1/staff/students?page=${page}`),

  async getProfile() {
    const profile = await request("GET", "/api/v1/staff/profile");
    Taro.setStorageSync("staff_profile", profile);
    return profile;
  },
};

const driver = useMockApi ? mockStaffApi : realStaffApi;

export const staffApi = {
  async loginWithWechat(code: string) {
    return persistStaffSession(await driver.loginWithWechat(code));
  },

  async loginWithAlipay(authCode: string) {
    return persistStaffSession(await driver.loginWithAlipay(authCode));
  },

  getCommissionDashboard: () => driver.getCommissionDashboard(),

  getStudents: (page = 1) => driver.getStudents(page),

  getProfile: () => driver.getProfile(),
};
