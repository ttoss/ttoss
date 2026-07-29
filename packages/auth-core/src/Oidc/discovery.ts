/** The subset of an OIDC discovery document this package consumes. */
export interface OidcDiscoveryDocument {
  /** The issuer identifier, echoed back from the discovery document. */
  issuer: string;
  /** JWKS endpoint used to fetch the signing keys for token verification. */
  jwksUri: string;
  /** Authorization endpoint, when advertised by the provider. */
  authorizationEndpoint?: string;
  /** Token endpoint, when advertised by the provider. */
  tokenEndpoint?: string;
}

/**
 * Fetches and parses an OpenID Connect discovery document from
 * `<issuer>/.well-known/openid-configuration` (per the OIDC Discovery 1.0
 * spec, which Entra ID, Okta, and every standards-compliant OIDC provider
 * implement).
 *
 * Throws when the endpoint is unreachable, returns a non-2xx status, or the
 * document is missing `jwks_uri` — there is no way to verify tokens without it.
 */
export const discoverOidcConfiguration = async (
  issuer: string
): Promise<OidcDiscoveryDocument> => {
  const base = issuer.replace(/\/$/, '');
  const discoveryUrl = `${base}/.well-known/openid-configuration`;

  const response = await fetch(discoveryUrl);
  if (!response.ok) {
    throw new Error(
      `OIDC discovery failed for issuer "${issuer}": GET ${discoveryUrl} returned HTTP ${response.status}`
    );
  }

  const doc = (await response.json()) as Record<string, unknown>;

  if (typeof doc.jwks_uri !== 'string') {
    throw new Error(
      `OIDC discovery document for issuer "${issuer}" is missing "jwks_uri"`
    );
  }

  return {
    issuer: typeof doc.issuer === 'string' ? doc.issuer : base,
    jwksUri: doc.jwks_uri,
    authorizationEndpoint:
      typeof doc.authorization_endpoint === 'string'
        ? doc.authorization_endpoint
        : undefined,
    tokenEndpoint:
      typeof doc.token_endpoint === 'string' ? doc.token_endpoint : undefined,
  };
};
