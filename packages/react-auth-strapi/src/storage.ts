const AUTH_STORAGE_REFRESH_TOKEN_KEY = 'ttoss-strapi-auth-refresh-token';

const isBrowser = typeof window !== 'undefined';

const getLocalStorage = () => {
  try {
    return isBrowser ? window.localStorage : null;
  } catch {
    return null;
  }
};

export const storage = {
  getRefreshToken: () => {
    const ls = getLocalStorage();
    if (!ls) return null;
    try {
      return ls.getItem(AUTH_STORAGE_REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken: (refreshToken: string) => {
    const ls = getLocalStorage();
    if (!ls) return;
    try {
      ls.setItem(AUTH_STORAGE_REFRESH_TOKEN_KEY, refreshToken);
    } catch {
      // ignore quota/security errors
    }
  },

  clearRefreshToken: () => {
    const ls = getLocalStorage();
    if (!ls) return;
    try {
      ls.removeItem(AUTH_STORAGE_REFRESH_TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};
