import { createOAuthClient, type OAuthClient } from '../client';

/** Options for {@link createTikTokClient}. */
export interface TikTokClientOptions {
  /** TikTok app `client_key` (TikTok's name for the client id). */
  clientKey: string;
  /** TikTok app `client_secret`. */
  clientSecret: string;
}

/**
 * Build an {@link OAuthClient} preconfigured for TikTok's Login Kit. Encodes
 * TikTok's deviations from RFC 6749: the client id is sent as `client_key` and
 * scopes are comma-separated. The token endpoint returns `open_id` alongside
 * the tokens, available on `TokenResponse.raw`.
 */
export const createTikTokClient = (
  options: TikTokClientOptions
): OAuthClient => {
  return createOAuthClient({
    authorizationUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    clientId: options.clientKey,
    clientSecret: options.clientSecret,
    params: {
      clientId: 'client_key',
      scopeSeparator: ',',
    },
  });
};
