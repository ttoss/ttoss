const AUTH_STORAGE_REFRESH_TOKEN_KEY = 'ttoss-strapi-auth-refresh-token';

export const storage = {
  getRefreshToken: () => {
    return localStorage.getItem(AUTH_STORAGE_REFRESH_TOKEN_KEY);
  },
  setRefreshToken: (refreshToken: string) => {
    localStorage.setItem(AUTH_STORAGE_REFRESH_TOKEN_KEY, refreshToken);
  },
  clearRefreshToken: () => {
    localStorage.removeItem(AUTH_STORAGE_REFRESH_TOKEN_KEY);
  },
};
