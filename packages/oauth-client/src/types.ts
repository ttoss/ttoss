/**
 * Overrides for providers that deviate from the RFC 6749 parameter names and
 * conventions. Every field is optional; unset fields fall back to the standard
 * OAuth 2.0 defaults.
 */
export interface ProviderParamOverrides {
  /** Parameter name carrying the client identifier. Default: `client_id`. */
  clientId?: string;
  /** Parameter name carrying the client secret. Default: `client_secret`. */
  clientSecret?: string;
  /** Separator used to join multiple scopes into one string. Default: `' '`. */
  scopeSeparator?: string;
  /** `grant_type` value sent when refreshing a token. Default: `refresh_token`. */
  refreshGrantType?: string;
}

/**
 * Normalized token response returned by every client method that talks to the
 * provider's token endpoint. `raw` preserves provider-specific fields (e.g.
 * TikTok's `open_id`) that the generic shape does not model.
 */
export interface TokenResponse {
  /** Short-lived access token used to call the provider's API. */
  accessToken: string;
  /** Long-lived token used to obtain new access tokens. */
  refreshToken: string;
  /** Lifetime of the access token, in seconds. */
  expiresIn: number;
  /** Untouched JSON body from the provider, for provider-specific fields. */
  raw: Record<string, unknown>;
}

/**
 * Maps a raw token endpoint JSON body to a {@link TokenResponse}. Supply this on
 * {@link OAuthProvider} when a provider names its token fields differently from
 * the OAuth 2.0 defaults (`access_token`, `refresh_token`, `expires_in`).
 */
export type TokenResponseParser = (
  raw: Record<string, unknown>
) => TokenResponse;

/**
 * Configuration for a third-party OAuth 2.0 provider. This is the generic,
 * provider-agnostic shape consumed by {@link createOAuthClient}. Pre-built
 * presets (e.g. `createTikTokClient`) assemble this for you.
 */
export interface OAuthProvider {
  /** Authorization endpoint the user is redirected to in order to log in. */
  authorizationUrl: string;
  /** Token endpoint used for both code exchange and refresh. */
  tokenUrl: string;
  /** OAuth client identifier issued by the provider. */
  clientId: string;
  /** OAuth client secret issued by the provider. */
  clientSecret: string;
  /** Overrides for providers that deviate from RFC 6749 parameter names. */
  params?: ProviderParamOverrides;
  /** Custom parser for non-standard token endpoint responses. */
  parseTokenResponse?: TokenResponseParser;
}

/**
 * Plain, ORM-agnostic snapshot of a stored token. The package never persists
 * these records itself — the caller loads them (decrypting if stored encrypted)
 * and persists updates via the `onRefresh` callback.
 */
export interface TokenRecord {
  /** Current access token (plaintext). */
  accessToken: string;
  /** Current refresh token (plaintext). */
  refreshToken: string;
  /** Absolute time at which the access token expires. */
  accessTokenExpiresAt: Date;
}
