import { randomUUID } from 'node:crypto';

import type {
  AccessTokenSigningOptions,
  IssuedTokens,
  IssueTokensArgs,
  OAuthServerOptions,
} from './oauthServerTypes';

/** Default access-token lifetime: one hour. */
export const DEFAULT_ACCESS_TOKEN_TTL = 60 * 60;

/**
 * The `issueTokens` the engine uses when the app sets `signing` without its
 * own: an RFC 9068 JWT access token signed by the key set's current key.
 *
 * App claims are spread first so the registered claims always win — an app
 * cannot accidentally (or through user-controlled data) rewrite `sub` or
 * `aud`.
 */
export const createSignedIssueTokens = (args: {
  issuer: string;
  signing: AccessTokenSigningOptions;
}): ((issueArgs: IssueTokensArgs) => Promise<IssuedTokens>) => {
  const { issuer, signing } = args;
  const ttl = signing.accessTokenTtl ?? DEFAULT_ACCESS_TOKEN_TTL;

  return async (issueArgs) => {
    const extra = (await signing.claims?.(issueArgs)) ?? {};

    const accessToken = signing.keySet.sign({
      payload: {
        ...extra,
        iss: issuer,
        sub: issueArgs.subject,
        aud: issueArgs.resource ?? issuer,
        client_id: issueArgs.client.client_id,
        scope: issueArgs.scopes.join(' '),
        jti: randomUUID(),
      },
      expiresInSeconds: ttl,
      typ: 'at+jwt',
    });

    const refreshToken = await signing.issueRefreshToken?.(issueArgs);

    return {
      accessToken,
      expiresIn: ttl,
      ...(refreshToken !== undefined ? { refreshToken } : {}),
    };
  };
};

/**
 * The minting hook the engine calls: the app's `issueTokens` when given, else
 * the signed default built from `signing`. Throws at construction when there
 * is neither, rather than on the first token request.
 */
export const resolveIssueTokens = (
  options: OAuthServerOptions
): NonNullable<OAuthServerOptions['issueTokens']> => {
  if (options.issueTokens) {
    return options.issueTokens;
  }
  if (options.signing) {
    return createSignedIssueTokens({
      issuer: options.issuer,
      signing: options.signing,
    });
  }
  throw new Error(
    'createOAuthHandlers needs issueTokens or signing to mint access tokens.'
  );
};
