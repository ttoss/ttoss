import { useNotifications } from '@ttoss/react-notifications';
import * as React from 'react';

import { useAuth } from './AuthProvider';
import { storage } from './storage';
import type { AuthData } from './types';

export type AuthSocialSignInCallbackProps = {
  /** Strapi provider slug, e.g. `"google"`, matching `/connect/:provider`. */
  provider: string;
  /** Called after the callback exchange sets the user as authenticated. */
  onSuccess?: () => void;
  /** Called if the callback exchange fails, with a user-facing message. */
  onError?: (message: string) => void;
  /** Rendered while the exchange is in flight (e.g. a spinner). */
  children?: React.ReactNode;
};

const GENERIC_ERROR_MESSAGE = 'An error occurred during social sign in.';

const TIMEOUT_ERROR_MESSAGE =
  'Sign in is taking longer than expected. Please try again.';

// The callback exchange has no bound otherwise: a slow/hung CMS request
// leaves the caller's "signing in..." UI spinning forever, with no error to
// react to. 15s covers a normal round trip (including the slower
// account-linking path some providers take) while still failing fast enough
// to let the user retry.
const CALLBACK_TIMEOUT_MS = 15_000;

const exchangeSocialSignInCallback = async ({
  apiUrl,
  provider,
}: {
  apiUrl: string;
  provider: string;
}): Promise<AuthData> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    return controller.abort();
  }, CALLBACK_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl}/auth/${provider}/callback${window.location.search}`,
      { signal: controller.signal }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(TIMEOUT_ERROR_MESSAGE);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || GENERIC_ERROR_MESSAGE);
  }

  if (data.refreshToken) {
    storage.setRefreshToken(data.refreshToken);
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      emailVerified: data.user.confirmed,
    },
    tokens: {
      accessToken: data.jwt,
      refreshToken: data.refreshToken,
    },
    isAuthenticated: true,
  };
};

/**
 * Mount this at the redirect route configured in Strapi's provider settings
 * (e.g. `/connect/google/redirect`). It reads the callback query string
 * Strapi appended to the redirect, forwards it to
 * `${apiUrl}/auth/:provider/callback`, and authenticates the user with the
 * resulting JWT — the same way `Auth`'s `onSignIn` does for email/password.
 */
export const AuthSocialSignInCallback = (
  props: AuthSocialSignInCallbackProps
) => {
  const { provider, onSuccess, onError, children } = props;

  const { apiUrl, setAuthData } = useAuth();

  const { addNotification } = useNotifications();

  React.useEffect(() => {
    let cancelled = false;

    exchangeSocialSignInCallback({ apiUrl, provider })
      .then((authData) => {
        if (cancelled) {
          return;
        }

        setAuthData(authData);
        onSuccess?.();
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE;

        addNotification({
          title: 'Sign in failed',
          message,
          type: 'error',
        });

        onError?.(message);
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, provider, setAuthData, addNotification, onSuccess, onError]);

  return <>{children}</>;
};
