import { CognitoJwtVerifier } from '@ttoss/auth-core/amazon-cognito';
import type { Router } from '@ttoss/http-server';
import type Koa from 'koa';

type Context = Koa.Context;

/** Amazon Cognito user pool configuration for JWT verification. */
export interface CognitoUserPoolConfig {
  /** The Cognito User Pool ID (e.g. `us-east-1_abc123`). */
  userPoolId: string;
  /**
   * Which token type to verify.
   * @default 'access'
   */
  tokenUse?: 'access' | 'id';
  /** The app client ID registered in the User Pool. */
  clientId: string;
}

/**
 * Authentication options for the MCP router.
 *
 * Supply either `cognitoUserPool` (uses `CognitoJwtVerifier` from
 * `@ttoss/auth-core`) or a custom `verifyToken` function — not both.
 */
export interface McpAuthOptions {
  /**
   * Amazon Cognito user pool config. When provided, the router creates a
   * `CognitoJwtVerifier` and validates every incoming Bearer token against it.
   */
  cognitoUserPool?: CognitoUserPoolConfig;
  /**
   * Custom token verifier for non-Cognito providers (Auth0, Keycloak, …).
   * Receives the raw Bearer token string. Should resolve with the verified
   * payload or reject/throw on failure.
   */
  verifyToken?: (token: string) => Promise<unknown>;
  /**
   * Router-level scope guard. All listed scopes must be present on the token
   * for any MCP request to be allowed. Returns 403 if any scope is missing.
   *
   * Cognito encodes scopes as a space-separated string in `payload.scope`.
   *
   * @example ['mcp:access']
   */
  requiredScopes?: string[];
  /**
   * URL of this MCP server, used in the OAuth Protected Resource Metadata
   * response (`/.well-known/oauth-protected-resource`). Both this field and
   * `authorizationServerUrl` must be provided to enable the endpoint.
   */
  resourceServerUrl?: string;
  /**
   * URL of the OAuth Authorization Server that issues tokens for this resource.
   * Enables `/.well-known/oauth-protected-resource` for MCP client auto-discovery
   * (RFC 9728) when combined with `resourceServerUrl`.
   */
  authorizationServerUrl?: string;
  /**
   * JSON-RPC methods (read from `body.method`) that bypass token verification,
   * so MCP clients can discover the server before authenticating. Set to an
   * empty array to require a token for every method.
   *
   * @default ['initialize', 'tools/list']
   */
  publicMethods?: string[];
  /**
   * When set, a `401` from verification responds with
   * `WWW-Authenticate: Bearer resource_metadata="<resourceMetadataUrl>"`
   * (RFC 9728) so MCP clients can auto-discover the authorization server.
   * When omitted, the header falls back to a bare `Bearer`.
   *
   * @example 'https://mcp.example.com/.well-known/oauth-protected-resource'
   */
  resourceMetadataUrl?: string;
}

/** MCP lifecycle/discovery methods reachable before a client authenticates. */
const DEFAULT_PUBLIC_METHODS = ['initialize', 'tools/list'];

/**
 * Builds the token verifier from the auth options, preferring an explicit
 * `verifyToken` and otherwise creating a `CognitoJwtVerifier`.
 */
export const buildTokenVerifier = (
  auth: McpAuthOptions
): ((token: string) => Promise<unknown>) => {
  if (auth.cognitoUserPool) {
    const v = CognitoJwtVerifier.create({
      tokenUse: 'access',
      ...auth.cognitoUserPool,
    });
    return (t) => {
      return v.verify(t);
    };
  }
  if (auth.verifyToken) {
    return auth.verifyToken;
  }
  throw new Error(
    'McpAuthOptions requires either cognitoUserPool or verifyToken'
  );
};

/** Returns true when the identity carries every required scope (or none are required). */
const hasRequiredScopes = (
  requiredScopes: string[] | undefined,
  identity: unknown
): boolean => {
  if (!requiredScopes?.length) {
    return true;
  }
  const scope = (identity as { scope?: string })?.scope ?? '';
  const tokenScopes = scope.split(' ');
  return requiredScopes.every((s) => {
    return tokenScopes.includes(s);
  });
};

/**
 * Registers the token-verification middleware (with public-method bypass and
 * RFC 9728 discovery) and, when configured, the OAuth protected-resource
 * metadata endpoint on the given router.
 */
export const registerAuthRoutes = (
  router: Router,
  path: string,
  auth: McpAuthOptions,
  tokenVerifier: (token: string) => Promise<unknown>
): void => {
  const publicMethods = new Set(auth.publicMethods ?? DEFAULT_PUBLIC_METHODS);
  const unauthorizedHeader = auth.resourceMetadataUrl
    ? `Bearer resource_metadata="${auth.resourceMetadataUrl}"`
    : 'Bearer';

  router.use(path, async (ctx: Context, next) => {
    // Public lifecycle/discovery methods bypass verification so clients can
    // discover the server before they have a token (MCP authorization spec).
    const method = (ctx.request.body as { method?: string } | undefined)
      ?.method;
    if (publicMethods.has(method ?? '')) {
      await next();
      return;
    }

    const authHeader = ctx.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

    let identity: unknown;
    try {
      identity = await tokenVerifier(token);
    } catch {
      ctx.status = 401;
      ctx.set('WWW-Authenticate', unauthorizedHeader);
      ctx.body = 'Unauthorized';
      return;
    }

    if (!hasRequiredScopes(auth.requiredScopes, identity)) {
      ctx.status = 403;
      ctx.body = 'Forbidden';
      return;
    }

    (ctx.state as { identity?: unknown }).identity = identity;
    await next();
  });

  if (auth.resourceServerUrl && auth.authorizationServerUrl) {
    router.get('/.well-known/oauth-protected-resource', (ctx: Context) => {
      ctx.body = {
        resource: auth.resourceServerUrl,
        authorization_servers: [auth.authorizationServerUrl],
      };
    });
  }
};
