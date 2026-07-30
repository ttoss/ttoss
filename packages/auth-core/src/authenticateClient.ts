import { timingSafeStringEqual } from './oauth';
import type {
  ClientStore,
  OAuthClient,
  OAuthRequest,
} from './oauthServerTypes';

/** Narrows an untyped request value to a string, or `undefined`. */
export const asString = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value : undefined;
};

/**
 * Authenticates the client at the token endpoint via `client_secret_basic`
 * (Authorization header), `client_secret_post` (body), or `none` (public,
 * PKCE-only). Returns the client, or `undefined` when authentication fails.
 */
export const authenticateClient = async (
  request: OAuthRequest,
  clientStore: ClientStore
): Promise<OAuthClient | undefined> => {
  let clientId = asString(request.body.client_id);
  let clientSecret = asString(request.body.client_secret);

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex !== -1) {
      clientId = decodeURIComponent(decoded.slice(0, separatorIndex));
      clientSecret = decodeURIComponent(decoded.slice(separatorIndex + 1));
    }
  }

  if (!clientId) {
    return undefined;
  }

  const client = await clientStore.get(clientId);
  if (!client) {
    return undefined;
  }

  /**
   * Confidential clients must present the matching secret. A store that keeps
   * secrets hashed at rest owns the comparison — it cannot return the raw value
   * for the engine to compare. Otherwise fall back to comparing the recoverable
   * `client_secret` the store returned, in constant time.
   */
  const secretVerified = clientStore.verifyClientSecret
    ? await clientStore.verifyClientSecret({ clientId, clientSecret })
    : !client.client_secret ||
      timingSafeStringEqual(client.client_secret, clientSecret);

  if (!secretVerified) {
    return undefined;
  }

  return client;
};
