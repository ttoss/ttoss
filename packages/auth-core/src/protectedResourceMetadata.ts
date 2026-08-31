/**
 * The single source of truth for RFC 9728 (OAuth 2.0 Protected Resource
 * Metadata): the document's shape, its well-known locations, and the
 * `WWW-Authenticate` value that points a client at them.
 *
 * It lives here, runner-agnostic, because three separate places used to derive
 * these independently — the OAuth server's discovery route, the standalone Koa
 * middleware, and `@ttoss/http-server-mcp`'s router — and they disagreed. The
 * derivation rule below is subtle enough that a second copy is a second bug.
 */

/** Well-known path prefix of the Protected Resource Metadata document. */
const WELL_KNOWN_PREFIX = '/.well-known/oauth-protected-resource';

/** RFC 9728 Protected Resource Metadata document. */
export interface ProtectedResourceMetadata {
  /** The resource identifier this document describes. */
  resource: string;
  /** Issuer identifiers of the authorization servers that issue for it. */
  authorization_servers: string[];
}

/**
 * Splits a resource identifier into its origin and its path, tolerating a
 * value that is not a parseable absolute URL (returned as origin-only, so a
 * caller still gets the root location rather than throwing during wiring).
 */
const splitResource = (resource: string): { origin: string; path: string } => {
  const trimmed = resource.replace(/\/$/, '');

  try {
    const url = new URL(trimmed);
    return {
      origin: url.origin,
      // `new URL` normalises an empty path to '/', which is "no path" here.
      path: url.pathname === '/' ? '' : url.pathname.replace(/\/$/, ''),
    };
  } catch {
    return { origin: trimmed, path: '' };
  }
};

/**
 * Builds the metadata document for a resource.
 *
 * @example
 * ```typescript
 * protectedResourceMetadataDocument({
 *   resource: 'https://mcp.example.com/mcp',
 *   authorizationServers: ['https://auth.example.com'],
 * });
 * // => { resource: 'https://mcp.example.com/mcp',
 * //      authorization_servers: ['https://auth.example.com'] }
 * ```
 */
export const protectedResourceMetadataDocument = (args: {
  /** The resource identifier (RFC 8707) this server identifies as. */
  resource: string;
  /** Issuer identifiers of the authorization servers that issue for it. */
  authorizationServers: string[];
}): ProtectedResourceMetadata => {
  return {
    resource: args.resource,
    authorization_servers: args.authorizationServers,
  };
};

/**
 * Every request path the document must be served at for a given resource, most
 * specific first.
 *
 * RFC 9728 §3.1 derives the metadata URL by inserting the well-known segment
 * **between the host and the path** of the resource identifier — so
 * `https://host/mcp` is discovered at
 * `https://host/.well-known/oauth-protected-resource/mcp`, *not* at
 * `https://host/mcp/.well-known/…` and *not* only at the root. Serving only the
 * root makes a client that applies the derivation rule fail discovery outright.
 *
 * The root is returned as well, because clients that follow the
 * `resource_metadata` value in `WWW-Authenticate` (rather than deriving) have
 * historically been pointed there — and a resource with no path derives the
 * root anyway, which is why the list is de-duplicated.
 *
 * @example
 * ```typescript
 * protectedResourceMetadataPaths({ resource: 'https://host/mcp' });
 * // => ['/.well-known/oauth-protected-resource/mcp',
 * //     '/.well-known/oauth-protected-resource']
 *
 * protectedResourceMetadataPaths({ resource: 'https://host' });
 * // => ['/.well-known/oauth-protected-resource']
 * ```
 */
export const protectedResourceMetadataPaths = (args: {
  /** The resource identifier the document describes. */
  resource: string;
}): string[] => {
  const { path } = splitResource(args.resource);

  if (!path) {
    return [WELL_KNOWN_PREFIX];
  }

  return [`${WELL_KNOWN_PREFIX}${path}`, WELL_KNOWN_PREFIX];
};

/**
 * The absolute URL a spec-following client derives for a resource — the first
 * entry of {@link protectedResourceMetadataPaths}, resolved against the
 * resource's own origin. This is the value to advertise in
 * `WWW-Authenticate: Bearer resource_metadata="…"`.
 *
 * **Throws** when `resource` is not an absolute URL, unlike
 * {@link protectedResourceMetadataPaths}, which falls back to the root. The
 * asymmetry is deliberate: a path is matched against incoming requests, so
 * tolerating a bad value costs a wrong route at worst and must not crash route
 * registration — whereas this value is *handed to clients* in a response
 * header, where an unparseable URL is a dead end the client cannot work around
 * and nobody operating the server would see. Fail at wiring time instead.
 *
 * @throws {Error} when `resource` is not an absolute URL.
 *
 * @example
 * ```typescript
 * protectedResourceMetadataUrl({ resource: 'https://host/mcp' });
 * // => 'https://host/.well-known/oauth-protected-resource/mcp'
 * ```
 */
export const protectedResourceMetadataUrl = (args: {
  /** The resource identifier the document describes. Must be an absolute URL. */
  resource: string;
}): string => {
  const trimmed = args.resource.replace(/\/$/, '');

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(
      `protectedResourceMetadataUrl requires an absolute URL as "resource", ` +
        `received ${JSON.stringify(args.resource)}. This value is advertised ` +
        `to clients in WWW-Authenticate: Bearer resource_metadata="…", so it ` +
        `cannot be derived from a relative or malformed identifier.`
    );
  }

  const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
  return `${url.origin}${path ? `${WELL_KNOWN_PREFIX}${path}` : WELL_KNOWN_PREFIX}`;
};
