import {
  AuthProvider as AuthProviderCore,
  useAuth as useAuthCore,
} from '@ttoss/react-auth-core';
import * as React from 'react';

import { storage } from './storage';

const AuthContext = React.createContext<{
  apiUrl: string;
}>({
  apiUrl: '',
});

export const AuthProvider = (
  props: React.PropsWithChildren<{ apiUrl: string }>
) => {
  const getAuthData = React.useCallback(async () => {
    try {
      const refreshToken = storage.getRefreshToken();

      if (!refreshToken) {
        return null;
      }

      /**
       * https://github.com/redon2/strapi-plugin-refresh-token
       */
      const refreshResponse = await fetch(
        `${props.apiUrl}/auth/local/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      const refreshData = (await refreshResponse.json()) as
        | {
            jwt: string;
            refreshToken: string;
          }
        | {
            error: string;
          };

      if ('error' in refreshData) {
        storage.clearRefreshToken();
        return null;
      }

      const meResponse = await fetch(`${props.apiUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${refreshData.jwt}`,
        },
      });

      const data = await meResponse.json();

      if (!meResponse.ok) {
        storage.clearRefreshToken();
        return null;
      }

      return {
        user: {
          id: data.id,
          email: data.email,
          emailVerified:
            data.confirmed ?? data.emailVerified ?? data.user?.confirmed,
        },
        tokens: {
          accessToken: refreshData.jwt,
          refreshToken: refreshData.refreshToken,
        },
        isAuthenticated: true,
      };
    } catch {
      storage.clearRefreshToken();
      return null;
    }
  }, [props.apiUrl]);

  const signOut = React.useCallback(async () => {
    storage.clearRefreshToken();
  }, []);

  return (
    <AuthContext.Provider value={{ apiUrl: props.apiUrl }}>
      <AuthProviderCore getAuthData={getAuthData} signOut={signOut}>
        {props.children}
      </AuthProviderCore>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const authCore = useAuthCore();
  const { apiUrl } = React.useContext(AuthContext);
  return { apiUrl, ...authCore };
};
