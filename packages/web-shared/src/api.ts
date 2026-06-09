import axios from "axios";

export interface ApiSuccess<T> {
  code: 0;
  message: "OK";
  requestId: string;
  timestamp: string;
  data: T;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export class ApiBusinessError extends Error {
  public readonly code?: number;
  public readonly status?: number;

  constructor(
    code?: number,
    message = "请求失败，请稍后重试",
    status?: number,
  ) {
    super(message);
    this.name = "ApiBusinessError";
    this.code = code;
    this.status = status;
  }
}

export const normalizeApiError = (
  error: unknown,
  fallbackMessage = "请求失败，请稍后重试",
  messageMap: Record<number, string> = {},
): ApiBusinessError => {
  if (error instanceof ApiBusinessError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const code = Number(error.response?.data?.code);
    const status = error.response?.status;
    const message =
      messageMap[code] ??
      error.response?.data?.message ??
      error.message ??
      fallbackMessage;

    return new ApiBusinessError(
      Number.isNaN(code) ? undefined : code,
      message,
      status,
    );
  }

  if (error instanceof Error) {
    return new ApiBusinessError(undefined, error.message || fallbackMessage);
  }

  return new ApiBusinessError(undefined, fallbackMessage);
};
