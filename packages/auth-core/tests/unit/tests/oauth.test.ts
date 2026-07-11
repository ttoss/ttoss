import crypto from 'node:crypto';

import {
  buildAuthorizationServerMetadata,
  buildProtectedResourceMetadata,
  generateAuthorizationCode,
  hashAuthorizationCode,
  OAuthError,
  oauthErrorCodes,
  validateRedirectUri,
  verifyPkceChallenge,
} from 'src/oauth';

// ---------------------------------------------------------------------------
// PKCE
// ---------------------------------------------------------------------------

describe('verifyPkceChallenge', () => {
  const makeChallenge = (verifier: string) => {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  };

  test('accepts a valid S256 challenge', () => {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = makeChallenge(codeVerifier);
    expect(
      verifyPkceChallenge({
        codeVerifier,
        codeChallenge,
        codeChallengeMethod: 'S256',
      })
    ).toBe(true);
  });

  test('rejects a tampered verifier', () => {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = makeChallenge(codeVerifier);
    expect(
      verifyPkceChallenge({
        codeVerifier: codeVerifier + 'x',
        codeChallenge,
        codeChallengeMethod: 'S256',
      })
    ).toBe(false);
  });

  test('rejects plain method', () => {
    const codeVerifier = 'abc';
    expect(
      verifyPkceChallenge({
        codeVerifier,
        codeChallenge: codeVerifier,
        codeChallengeMethod: 'plain',
      })
    ).toBe(false);
  });

  test('rejects unknown method', () => {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = makeChallenge(codeVerifier);
    expect(
      verifyPkceChallenge({
        codeVerifier,
        codeChallenge,
        codeChallengeMethod: 'RS256',
      })
    ).toBe(false);
  });

  test('rejects empty verifier', () => {
    expect(
      verifyPkceChallenge({
        codeVerifier: '',
        codeChallenge: 'abc',
        codeChallengeMethod: 'S256',
      })
    ).toBe(false);
  });

  test('rejects empty challenge', () => {
    expect(
      verifyPkceChallenge({
        codeVerifier: 'abc',
        codeChallenge: '',
        codeChallengeMethod: 'S256',
      })
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Authorization codes
// ---------------------------------------------------------------------------

describe('generateAuthorizationCode / hashAuthorizationCode', () => {
  test('generates a 64-char hex code with matching hash', () => {
    const { code, codeHash } = generateAuthorizationCode();
    expect(code).toHaveLength(64);
    expect(codeHash).toBe(hashAuthorizationCode({ code }));
  });

  test('raw code never equals its hash', () => {
    const { code, codeHash } = generateAuthorizationCode();
    expect(code).not.toBe(codeHash);
  });

  test('hash is deterministic', () => {
    const { code } = generateAuthorizationCode();
    expect(hashAuthorizationCode({ code })).toBe(
      hashAuthorizationCode({ code })
    );
  });

  test('different codes produce different hashes', () => {
    const a = generateAuthorizationCode();
    const b = generateAuthorizationCode();
    expect(a.codeHash).not.toBe(b.codeHash);
  });
});

// ---------------------------------------------------------------------------
// Redirect URI validation
// ---------------------------------------------------------------------------

describe('validateRedirectUri', () => {
  const allowed = [
    'https://example.com/callback',
    'https://app.example.com/oauth/callback',
  ];

  test('accepts an exact match', () => {
    expect(
      validateRedirectUri({
        redirectUri: 'https://example.com/callback',
        allowedRedirectUris: allowed,
      })
    ).toBe(true);
  });

  test('rejects a trailing slash', () => {
    expect(
      validateRedirectUri({
        redirectUri: 'https://example.com/callback/',
        allowedRedirectUris: allowed,
      })
    ).toBe(false);
  });

  test('rejects an extra query string', () => {
    expect(
      validateRedirectUri({
        redirectUri: 'https://example.com/callback?foo=bar',
        allowedRedirectUris: allowed,
      })
    ).toBe(false);
  });

  test('rejects a different host', () => {
    expect(
      validateRedirectUri({
        redirectUri: 'https://evil.com/callback',
        allowedRedirectUris: allowed,
      })
    ).toBe(false);
  });

  test('rejects a subdomain prefix attack (claude.ai.evil.com)', () => {
    expect(
      validateRedirectUri({
        redirectUri: 'https://example.com.evil.com/callback',
        allowedRedirectUris: allowed,
      })
    ).toBe(false);
  });

  test('rejects http downgrade', () => {
    expect(
      validateRedirectUri({
        redirectUri: 'http://example.com/callback',
        allowedRedirectUris: allowed,
      })
    ).toBe(false);
  });

  test('rejects a different path', () => {
    expect(
      validateRedirectUri({
        redirectUri: 'https://example.com/other',
        allowedRedirectUris: allowed,
      })
    ).toBe(false);
  });

  test('returns false for an empty allowed list', () => {
    expect(
      validateRedirectUri({
        redirectUri: 'https://example.com/callback',
        allowedRedirectUris: [],
      })
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// OAuthError
// ---------------------------------------------------------------------------

describe('OAuthError', () => {
  test('stores code and message', () => {
    const err = new OAuthError({
      code: 'invalid_grant',
      description: 'Code expired',
    });
    expect(err.code).toBe('invalid_grant');
    expect(err.message).toBe('Code expired');
    expect(err.name).toBe('OAuthError');
    expect(err instanceof Error).toBe(true);
  });

  test('oauthErrorCodes covers expected values', () => {
    expect(oauthErrorCodes).toContain('invalid_request');
    expect(oauthErrorCodes).toContain('invalid_client');
    expect(oauthErrorCodes).toContain('invalid_grant');
    expect(oauthErrorCodes).toContain('unsupported_grant_type');
    expect(oauthErrorCodes).toContain('access_denied');
    expect(oauthErrorCodes).toContain('server_error');
  });
});

// ---------------------------------------------------------------------------
// Discovery document builders
// ---------------------------------------------------------------------------

describe('buildAuthorizationServerMetadata', () => {
  const base = {
    issuer: 'https://auth.example.com',
    authorizationEndpoint: 'https://auth.example.com/authorize',
    tokenEndpoint: 'https://auth.example.com/token',
  };

  test('sets required fields', () => {
    const meta = buildAuthorizationServerMetadata(base);
    expect(meta.issuer).toBe(base.issuer);
    expect(meta.authorization_endpoint).toBe(base.authorizationEndpoint);
    expect(meta.token_endpoint).toBe(base.tokenEndpoint);
  });

  test('advertises only code response type', () => {
    const meta = buildAuthorizationServerMetadata(base);
    expect(meta.response_types_supported).toEqual(['code']);
  });

  test('advertises only authorization_code grant type', () => {
    const meta = buildAuthorizationServerMetadata(base);
    expect(meta.grant_types_supported).toEqual(['authorization_code']);
  });

  test('advertises only S256 code challenge method', () => {
    const meta = buildAuthorizationServerMetadata(base);
    expect(meta.code_challenge_methods_supported).toEqual(['S256']);
  });

  test('advertises only none token endpoint auth method', () => {
    const meta = buildAuthorizationServerMetadata(base);
    expect(meta.token_endpoint_auth_methods_supported).toEqual(['none']);
  });

  test('includes registration_endpoint when provided', () => {
    const meta = buildAuthorizationServerMetadata({
      ...base,
      registrationEndpoint: 'https://auth.example.com/register',
    });
    expect(meta.registration_endpoint).toBe(
      'https://auth.example.com/register'
    );
  });

  test('omits registration_endpoint when not provided', () => {
    const meta = buildAuthorizationServerMetadata(base);
    expect('registration_endpoint' in meta).toBe(false);
  });
});

describe('buildProtectedResourceMetadata', () => {
  test('sets resource and authorization_servers', () => {
    const meta = buildProtectedResourceMetadata({
      resource: 'https://mcp.example.com',
      authorizationServers: ['https://auth.example.com'],
    });
    expect(meta.resource).toBe('https://mcp.example.com');
    expect(meta.authorization_servers).toEqual(['https://auth.example.com']);
  });
});
