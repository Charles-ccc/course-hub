import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearSession,
  getSession,
  getToken,
  isDevToken,
  setSession,
} from "../auth/session";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";

export const httpClient = axios.create({
  baseURL,
  timeout: 10000,
});

const refreshClient = axios.create({
  baseURL,
  timeout: 10000,
});

let refreshRequest: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const session = getSession();
  if (!session?.refreshToken) {
    return null;
  }

  const { data } = await refreshClient.post("/auth/refresh", {
    refreshToken: session.refreshToken,
  });

  const nextToken = String(data?.data?.accessToken ?? "");
  const nextRefreshToken = String(
    data?.data?.refreshToken ?? session.refreshToken,
  );
  if (!nextToken || !nextRefreshToken) {
    return null;
  }

  setSession({
    ...session,
    token: nextToken,
    refreshToken: nextRefreshToken,
  });

  return nextToken;
};

const ensureAccessToken = async (): Promise<string | null> => {
  if (!refreshRequest) {
    refreshRequest = refreshAccessToken().finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
};

httpClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const token = getToken();
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const requestUrl = originalRequest?.url ?? "";

    const isAuthLoginRequest = requestUrl.includes("/auth/phone/login");

    if (
      error.response?.status === 401 &&
      !isAuthLoginRequest &&
      !!token &&
      !isDevToken(token) &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const nextToken = await ensureAccessToken();
        if (nextToken) {
          originalRequest.headers.Authorization = `Bearer ${nextToken}`;
          return httpClient(originalRequest);
        }
      } catch {
        clearSession();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      clearSession();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
