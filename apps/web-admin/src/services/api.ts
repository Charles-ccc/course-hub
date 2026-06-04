import axios from "axios";
import { useAdminAuthStore } from "../store/auth";
import { mockAdminApi } from "./mock";

const http = axios.create({ baseURL: "/api" });
const useMockApi = import.meta.env.VITE_USE_FRONTEND_MOCK === "true";

const isDevSessionToken = (token: string | null | undefined) =>
  typeof token === "string" && token.startsWith("dev-");

http.interceptors.request.use((cfg) => {
  const token = useAdminAuthStore.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

http.interceptors.response.use(
  (r) => r.data.data,
  (err) => {
    const token = useAdminAuthStore.getState().token;
    if (err.response?.status === 401 && token && !isDevSessionToken(token)) {
      useAdminAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(new Error(err.response?.data?.message || "请求失败"));
  },
);

const realAdminApi = {
  login: (username: string, password: string) =>
    http.post("/v1/auth/admin/login", { username, password }),
  getOrgs: (params?: any) => http.get("/v1/admin/orgs", { params }),
  getStaffList: () => http.get("/v1/admin/staff"),
  approveOrg: (id: string, feeRate: number) =>
    http.post(`/v1/admin/orgs/${id}/approve`, { feeRate }),
  suspendOrg: (id: string, reason: string) =>
    http.post(`/v1/admin/orgs/${id}/suspend`, { reason }),
  disableStaff: (id: string) => http.post(`/v1/admin/staff/${id}/disable`),
  getHealthMetrics: () => http.get("/v1/admin/report/health"),
  getGmv: (period: string) =>
    http.get("/v1/admin/report/gmv", { params: { period } }),
  setPriceCap: (cap: number) => http.put("/v1/admin/config/price-cap", { cap }),
  setCreditConfig: (config: any) => http.put("/v1/admin/config/credit", config),
  getSettlement: (page = 1) => http.get("/v1/admin/settlement", { params: { page } }),
  doSettle: (id: string) => http.post(`/v1/admin/settlement/${id}/settle`),
  getOverdueRate: () => http.get("/v1/admin/report/overdue-rate"),
};

export const adminApi = useMockApi ? mockAdminApi : realAdminApi;
