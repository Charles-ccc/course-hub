import { STORAGE_KEYS } from "../constants/storage";
import type { AuthSession } from "../types/domain";
import { createSessionStorage, isDevToken } from "@wangke/web-shared";

const sessionStorage = createSessionStorage<AuthSession>({
  token: STORAGE_KEYS.token,
  fields: {
    refreshToken: STORAGE_KEYS.refreshToken,
    role: STORAGE_KEYS.role,
    orgId: STORAGE_KEYS.orgId,
    orgName: STORAGE_KEYS.orgName,
  },
});

export const getToken = sessionStorage.getToken;
export const getSession = sessionStorage.getSession;
export const setSession = sessionStorage.setSession;
export const clearSession = sessionStorage.clearSession;
export { isDevToken };
