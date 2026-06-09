import { ApiBusinessError, normalizeApiError } from "@wangke/web-shared";

export const BUSINESS_ERROR_CODES = {
  INVALID_CREDENTIALS: 40001,
  PRICE_LIMIT_EXCEEDED: 40002,
  CREDIT_PROVIDER_NOT_ENABLED: 42202,
} as const;

export const BUSINESS_ERROR_MESSAGES: Record<number, string> = {
  [BUSINESS_ERROR_CODES.INVALID_CREDENTIALS]: "用户名或密码错误",
  [BUSINESS_ERROR_CODES.PRICE_LIMIT_EXCEEDED]:
    "课程定价超出平台允许的最高金额，请调低定价后重试。",
  [BUSINESS_ERROR_CODES.CREDIT_PROVIDER_NOT_ENABLED]:
    "当前支付通道未启用，请联系平台处理。",
};

export const toApiBusinessError = (
  error: unknown,
  fallbackMessage = "请求失败，请稍后重试",
): ApiBusinessError => {
  return normalizeApiError(error, fallbackMessage, BUSINESS_ERROR_MESSAGES);
};

export { ApiBusinessError };
