export interface SessionStorageShape {
  token: string;
}

export interface SessionStorageKeys<T extends SessionStorageShape> {
  token: string;
  fields: Record<Exclude<keyof T, "token">, string>;
}

export const isDevToken = (token: string | null): boolean =>
  !!token?.startsWith("dev-");

export const createSessionStorage = <T extends SessionStorageShape>(
  keys: SessionStorageKeys<T>,
) => {
  const fieldEntries = Object.entries(keys.fields) as Array<
    [Exclude<keyof T, "token">, string]
  >;

  const getToken = (): string | null => localStorage.getItem(keys.token);

  const getSession = (): T | null => {
    const token = localStorage.getItem(keys.token);

    if (!token) {
      return null;
    }

    const result: Record<string, string> = { token };

    for (const [field, storageKey] of fieldEntries) {
      const value = localStorage.getItem(storageKey);
      if (!value) {
        return null;
      }
      result[field as string] = value;
    }

    return result as unknown as T;
  };

  const setSession = (session: T): void => {
    localStorage.setItem(keys.token, session.token);

    for (const [field, storageKey] of fieldEntries) {
      localStorage.setItem(storageKey, String(session[field as keyof T]));
    }
  };

  const clearSession = (): void => {
    localStorage.removeItem(keys.token);

    for (const [, storageKey] of fieldEntries) {
      localStorage.removeItem(storageKey);
    }
  };

  return {
    getToken,
    getSession,
    setSession,
    clearSession,
  };
};
