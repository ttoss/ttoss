import type {
  OAuthProvider,
  TokenRecord,
  TokenResponse,
  TokenResponseParser,
} from './types';

/** Default safety window for lazy refresh: 2 hours. */
export const DEFAULT_REFRESH_WINDOW_MS = 2 * 60 * 60 * 1000;

const defaultParseTokenResponse: TokenResponseParser = (raw) => {
  return {
    accessToken: String(raw.access_token),
    refreshToken: String(raw.refresh_token),
    expiresIn: Number(raw.expires_in),
    raw,
  };
};

/** Options for {@link OAuthClient.buildAuthUrl}. */
export interface BuildAuthUrlOptions {
  /** Where the provider redirects the user back to after consent. */
  redirectUri: string;
  /** Requested scope(s). An array is joined with the provider's separator. */
  scope: string | string[];
  /** Opaque CSRF value; persist it and verify it on callback. */
  state: string;
  /** Extra provider-specific query parameters to append. */
  extraParams?: Record<string, string>;
}

/** Options for {@link OAuthClient.exchangeCode}. */
export interface ExchangeCodeOptions {
  /** Authorization code received on the callback. */
  code: string;
  /** Must match the `redirectUri` used to build the authorization URL. */
  redirectUri: string;
}

/** Options for {@link OAuthClient.getValidToken}. */
export interface GetValidTokenOptions {
  /** Refresh if the access token expires within this window. Default: 2h. */
  refreshWindowMs?: number;
  /** Called with the refreshed tokens so the caller can persist them. */
  onRefresh: (updated: TokenResponse) => Promise<void> | void;
}

/**
 * A configured OAuth 2.0 client bound to a single provider. Obtain one via
 * {@link createOAuthClient} or a provider preset (e.g. `createTikTokClient`).
 */
export interface OAuthClient {
  /** Build the provider's authorization URL to redirect the user to. */
  buildAuthUrl: (options: BuildAuthUrlOptions) => string;
  /** Exchange an authorization code for tokens at the token endpoint. */
  exchangeCode: (options: ExchangeCodeOptions) => Promise<TokenResponse>;
  /** Refresh an access token using a stored refresh token. */
  refreshAccessToken: (refreshToken: string) => Promise<TokenResponse>;
  /**
   * Return a valid access token, refreshing first if it expires within
   * `refreshWindowMs`. On refresh, `onRefresh` is awaited before returning so
   * the caller can persist the new tokens.
   */
  getValidToken: (
    record: TokenRecord,
    options: GetValidTokenOptions
  ) => Promise<string>;
}

/**
 * Create an OAuth client for a generic {@link OAuthProvider}. The returned
 * client is stateless and delegates all persistence to its caller, making it
 * ORM- and storage-agnostic.
 */
export const createOAuthClient = (provider: OAuthProvider): OAuthClient => {
  const clientIdParam = provider.params?.clientId ?? 'client_id';
  const clientSecretParam = provider.params?.clientSecret ?? 'client_secret';
  const scopeSeparator = provider.params?.scopeSeparator ?? ' ';
  const refreshGrantType = provider.params?.refreshGrantType ?? 'refresh_token';
  const parse = provider.parseTokenResponse ?? defaultParseTokenResponse;

  const requestToken = async (
    body: URLSearchParams
  ): Promise<TokenResponse> => {
    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `OAuth token request failed: ${response.status} ${response.statusText} ${text}`
      );
    }

    return parse(await response.json());
  };

  const refreshAccessToken = (refreshToken: string) => {
    return requestToken(
      new URLSearchParams({
        [clientIdParam]: provider.clientId,
        [clientSecretParam]: provider.clientSecret,
        grant_type: refreshGrantType,
        refresh_token: refreshToken,
      })
    );
  };

  return {
    buildAuthUrl: ({ redirectUri, scope, state, extraParams }) => {
      const url = new URL(provider.authorizationUrl);
      url.searchParams.set(clientIdParam, provider.clientId);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set(
        'scope',
        Array.isArray(scope) ? scope.join(scopeSeparator) : scope
      );
      url.searchParams.set('state', state);
      for (const [key, value] of Object.entries(extraParams ?? {})) {
        url.searchParams.set(key, value);
      }
      return url.toString();
    },

    exchangeCode: ({ code, redirectUri }) => {
      return requestToken(
        new URLSearchParams({
          [clientIdParam]: provider.clientId,
          [clientSecretParam]: provider.clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        })
      );
    },

    refreshAccessToken,

    getValidToken: async (record, options) => {
      const refreshWindowMs =
        options.refreshWindowMs ?? DEFAULT_REFRESH_WINDOW_MS;
      const msUntilExpiry = record.accessTokenExpiresAt.getTime() - Date.now();

      if (msUntilExpiry > refreshWindowMs) {
        return record.accessToken;
      }

      const updated = await refreshAccessToken(record.refreshToken);
      await options.onRefresh(updated);
      return updated.accessToken;
    },
  };
};
