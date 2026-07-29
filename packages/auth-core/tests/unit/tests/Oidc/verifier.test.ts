import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createOidcVerifier } from 'src/Oidc/verifier';

jest.mock('jose', () => {
  return {
    createRemoteJWKSet: jest.fn(),
    jwtVerify: jest.fn(),
  };
});

jest.mock('src/Oidc/discovery', () => {
  return {
    discoverOidcConfiguration: jest.fn(),
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { discoverOidcConfiguration } = jest.requireMock('src/Oidc/discovery');

const ISSUER = 'https://login.microsoftonline.com/tenant/v2.0';
const JWKS_URI = 'https://login.microsoftonline.com/tenant/discovery/v2.0/keys';

describe('createOidcVerifier', () => {
  beforeEach(() => {
    jest.mocked(discoverOidcConfiguration).mockResolvedValue({
      issuer: ISSUER,
      jwksUri: JWKS_URI,
    });
    jest.mocked(createRemoteJWKSet).mockReturnValue('jwks-set' as never);
  });

  test('discovers the issuer once, builds a remote JWKS, and verifies the token', async () => {
    jest
      .mocked(jwtVerify)
      .mockResolvedValue({ payload: { sub: 'user-1' } } as never);

    const verify = createOidcVerifier({ issuer: ISSUER });

    const payload = await verify('token-1');

    expect(discoverOidcConfiguration).toHaveBeenCalledWith(ISSUER);
    expect(createRemoteJWKSet).toHaveBeenCalledWith(new URL(JWKS_URI));
    expect(jwtVerify).toHaveBeenCalledWith('token-1', 'jwks-set', {
      issuer: ISSUER,
    });
    expect(payload).toEqual({ sub: 'user-1' });
  });

  test('reuses the discovered JWKS across multiple verify calls', async () => {
    jest
      .mocked(jwtVerify)
      .mockResolvedValue({ payload: { sub: 'user-1' } } as never);

    const verify = createOidcVerifier({ issuer: ISSUER });

    await verify('token-1');
    await verify('token-2');

    expect(discoverOidcConfiguration).toHaveBeenCalledTimes(1);
    expect(createRemoteJWKSet).toHaveBeenCalledTimes(1);
  });

  test('propagates a jwtVerify rejection (invalid signature, issuer, or expiry)', async () => {
    jest
      .mocked(jwtVerify)
      .mockRejectedValue(new Error('signature verification failed'));

    const verify = createOidcVerifier({ issuer: ISSUER });

    await expect(verify('bad-token')).rejects.toThrow(
      'signature verification failed'
    );
  });

  test('retries discovery on the next call after a discovery failure', async () => {
    jest
      .mocked(discoverOidcConfiguration)
      .mockRejectedValueOnce(new Error('discovery unreachable'))
      .mockResolvedValueOnce({ issuer: ISSUER, jwksUri: JWKS_URI });
    jest
      .mocked(jwtVerify)
      .mockResolvedValue({ payload: { sub: 'user-1' } } as never);

    const verify = createOidcVerifier({ issuer: ISSUER });

    await expect(verify('token-1')).rejects.toThrow('discovery unreachable');

    // Allow the internal `.catch` that clears the cached promise to run.
    await Promise.resolve();
    await Promise.resolve();

    const payload = await verify('token-2');

    expect(discoverOidcConfiguration).toHaveBeenCalledTimes(2);
    expect(payload).toEqual({ sub: 'user-1' });
  });
});
