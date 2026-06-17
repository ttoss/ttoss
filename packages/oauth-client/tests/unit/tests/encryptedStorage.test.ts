import {
  decryptValue,
  encryptValue,
  generateEncryptionKey,
} from '@ttoss/auth-core';
import { createOAuthClient, type TokenResponse } from 'src/index';

/**
 * Demonstrates the recommended at-rest encryption pattern: the package stays
 * encryption-agnostic and operates on plaintext records; the caller decrypts on
 * load and re-encrypts inside `onRefresh` using `@ttoss/auth-core`.
 */
describe('encrypted storage integration with @ttoss/auth-core', () => {
  test('round-trips tokens through encryptValue/decryptValue across a refresh', async () => {
    const key = generateEncryptionKey();

    // Stored encrypted, expiring within the refresh window.
    const stored = {
      accessToken: encryptValue({ plaintext: 'old-access', key }),
      refreshToken: encryptValue({ plaintext: 'old-refresh', key }),
      accessTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => {
        return {
          access_token: 'fresh-access',
          refresh_token: 'fresh-refresh',
          expires_in: 3600,
        };
      },
      text: async () => {
        return '';
      },
    }) as unknown as typeof fetch;

    const client = createOAuthClient({
      authorizationUrl: 'https://provider.example/authorize',
      tokenUrl: 'https://provider.example/token',
      clientId: 'id',
      clientSecret: 'secret',
    });

    let persisted: { accessToken: string; refreshToken: string } | undefined;

    const accessToken = await client.getValidToken(
      {
        accessToken: decryptValue({ ciphertext: stored.accessToken, key }),
        refreshToken: decryptValue({ ciphertext: stored.refreshToken, key }),
        accessTokenExpiresAt: stored.accessTokenExpiresAt,
      },
      {
        onRefresh: (updated: TokenResponse) => {
          persisted = {
            accessToken: encryptValue({ plaintext: updated.accessToken, key }),
            refreshToken: encryptValue({
              plaintext: updated.refreshToken,
              key,
            }),
          };
        },
      }
    );

    expect(accessToken).toBe('fresh-access');
    expect(persisted?.accessToken).not.toContain('fresh-access');
    expect(decryptValue({ ciphertext: persisted!.accessToken, key })).toBe(
      'fresh-access'
    );

    jest.restoreAllMocks();
  });
});
