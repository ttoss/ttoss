import { createRemoteJWKSet, type JWTPayload, jwtVerify } from 'jose';

import { discoverOidcConfiguration } from './discovery';

/** Options for {@link createOidcVerifier}. */
export interface CreateOidcVerifierOptions {
  /**
   * The OIDC issuer URL (e.g. `https://login.microsoftonline.com/<tenant>/v2.0`
   * for Entra ID, or `https://<domain>.okta.com/oauth2/default` for Okta).
   * The provider's `/.well-known/openid-configuration` document is fetched
   * from this URL to discover its JWKS endpoint, and the token's `iss` claim
   * must match it exactly.
   */
  issuer: string;
}

/**
 * Builds a token verifier for any standards-compliant OIDC provider (Entra
 * ID, Okta, Auth0, Google, …) with no manual JWKS wiring: the provider's
 * signing keys are discovered from its `/.well-known/openid-configuration`
 * document and cached, key rotation is handled transparently, and the
 * token's signature, issuer, and expiry are verified before the payload is
 * returned.
 *
 * The returned function matches the `verifyToken` shape expected by
 * `McpAuthOptions` in `@ttoss/http-server-mcp` — pass it directly as
 * `auth.verifyToken`. Audience / resource-indicator validation is left to
 * the caller (e.g. `McpAuthOptions.resourceIndicator`), since the expected
 * audience is a property of the resource server, not the identity provider.
 *
 * Discovery runs once per verifier instance — create one verifier at
 * startup and reuse it across requests rather than calling this per request.
 *
 * @example
 * ```typescript
 * import { createOidcVerifier } from '@ttoss/auth-core/oidc';
 * import { createMcpRouter } from '@ttoss/http-server-mcp';
 *
 * const verifyToken = createOidcVerifier({
 *   issuer: 'https://login.microsoftonline.com/<tenant>/v2.0',
 * });
 *
 * const mcpRouter = createMcpRouter(mcpServer, {
 *   auth: {
 *     verifyToken,
 *     resourceIndicator: 'https://mcp.example.com',
 *   },
 * });
 * ```
 */
export const createOidcVerifier = (
  options: CreateOidcVerifierOptions
): ((token: string) => Promise<JWTPayload>) => {
  const { issuer } = options;

  let jwksSetPromise:
    Promise<ReturnType<typeof createRemoteJWKSet>> | undefined;

  const getJwks = (): Promise<ReturnType<typeof createRemoteJWKSet>> => {
    if (!jwksSetPromise) {
      jwksSetPromise = discoverOidcConfiguration(issuer).then(({ jwksUri }) => {
        return createRemoteJWKSet(new URL(jwksUri));
      });
      // Reset on failure so a transient discovery error doesn't permanently
      // wedge the verifier — the next call retries discovery.
      jwksSetPromise.catch(() => {
        jwksSetPromise = undefined;
      });
    }
    return jwksSetPromise;
  };

  return async (token: string): Promise<JWTPayload> => {
    const jwks = await getJwks();
    const { payload } = await jwtVerify(token, jwks, { issuer });
    return payload;
  };
};
