import { createSessionStorage, isDevToken } from "@wangke/web-shared";
import { STORAGE_KEYS } from "../constants/storage";
import type { AuthSession } from "../types/domain";

const sessionStorage = createSessionStorage<AuthSession>({
  token: STORAGE_KEYS.token,
  fields: {
    refreshToken: STORAGE_KEYS.refreshToken,
    role: STORAGE_KEYS.role,
    staffId: STORAGE_KEYS.staffId,
    staffProfile: STORAGE_KEYS.staffProfile,
  },
});

export const getToken = sessionStorage.getToken;
export const getSession = sessionStorage.getSession;
export const setSession = sessionStorage.setSession;
export const clearSession = sessionStorage.clearSession;
export { isDevToken };
