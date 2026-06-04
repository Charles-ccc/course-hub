import axios from "axios";
import { useAuthStore } from "../store/auth";
import { mockOrgApi } from "./mock";

const http = axios.create({ baseURL: "/api" });
const useMockApi = import.meta.env.VITE_USE_FRONTEND_MOCK === "true";

const isDevSessionToken = (token: string | null | undefined) =>
  typeof token === "string" && token.startsWith("dev-");

http.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

http.interceptors.response.use(
  (r) => r.data.data,
  (err) => {
    const token = useAuthStore.getState().token;
    if (err.response?.status === 401 && token && !isDevSessionToken(token)) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(new Error(err.response?.data?.message || "请求失败"));
  },
);

const realOrgApi = {
  login: (phone: string, password: string) =>
    http.post("/v1/auth/org/login", { phone, password }),
  getProfile: () => http.get("/v1/org/profile"),
  getOrders: (params?: any) => http.get("/v1/org/orders", { params }),
  getQaList: (params?: any) => http.get("/v1/org/qa", { params }),
  overdueAction: (id: string, action: string, remark?: string) =>
    http.post(`/v1/org/overdue/${id}/action`, { action, remark }),
  replyQa: (id: string, reply: string) =>
    http.post(`/v1/org/qa/${id}/reply`, { reply }),
  getSettlement: () => http.get("/v1/org/settlement"),
  getDeposit: () => http.get("/v1/org/deposit"),
  createCourse: (data: any) => http.post("/v1/courses/org", data),
  updateCourse: (id: string, data: any) =>
    http.put(`/v1/courses/org/${id}`, data),
  getCourses: (orgId: string) =>
    http.get(`/v1/courses?orgId=${orgId}&size=100`),
};

export const orgApi = useMockApi ? mockOrgApi : realOrgApi;
