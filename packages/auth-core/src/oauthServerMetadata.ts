import type { OAuthHandlers, OAuthServerOptions } from './oauthServerTypes';

export const joinUrl = (issuer: string, path: string): string => {
  return `${issuer.replace(/\/$/, '')}${path}`;
};

/** The grants the server can honour: `refresh_token` only with `onRefreshToken`. */
export const supportedGrantTypes = (options: OAuthServerOptions): string[] => {
  return options.onRefreshToken
    ? ['authorization_code', 'refresh_token']
    : ['authorization_code'];
};

/** Endpoint paths with every default applied. */
export const resolveOAuthPaths = (
  options: OAuthServerOptions
): OAuthHandlers['paths'] => {
  return {
    authorize: options.endpoints?.authorize ?? '/authorize',
    token: options.endpoints?.token ?? '/token',
    register: options.endpoints?.register ?? '/register',
    jwks: options.endpoints?.jwks ?? '/.well-known/jwks.json',
  };
};

/**
 * The RFC 8414 Authorization Server Metadata document. `jwks_uri` appears only
 * with `signing`, since only then does the server publish keys.
 */
export const authorizationServerMetadataDocument = (args: {
  options: OAuthServerOptions;
  paths: OAuthHandlers['paths'];
}): Record<string, unknown> => {
  const { options, paths } = args;
  const { issuer, scopesSupported, signing } = options;
  return {
    issuer,
    authorization_endpoint: joinUrl(issuer, paths.authorize),
    token_endpoint: joinUrl(issuer, paths.token),
    registration_endpoint: joinUrl(issuer, paths.register),
    response_types_supported: ['code'],
    grant_types_supported: supportedGrantTypes(options),
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
      'none',
    ],
    ...(scopesSupported ? { scopes_supported: scopesSupported } : {}),
    ...(signing ? { jwks_uri: joinUrl(issuer, paths.jwks) } : {}),
  };
};
