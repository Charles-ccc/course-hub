import { ApiBusinessError, normalizeApiError } from "@wangke/web-shared";

export const BUSINESS_ERROR_CODES = {
  INVALID_CREDENTIALS: 40001,
  STAFF_DISABLED: 40003,
} as const;

export const BUSINESS_ERROR_MESSAGES: Record<number, string> = {
  [BUSINESS_ERROR_CODES.INVALID_CREDENTIALS]: "登录失败，请检查手机号或密码",
  [BUSINESS_ERROR_CODES.STAFF_DISABLED]: "当前账号已被禁用，请联系平台管理员",
};

export const toApiBusinessError = (
  error: unknown,
  fallbackMessage = "请求失败，请稍后重试",
): ApiBusinessError => {
  return normalizeApiError(error, fallbackMessage, BUSINESS_ERROR_MESSAGES);
};

export { ApiBusinessError };
