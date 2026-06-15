import { findExpiringTokens } from 'src/index';

const recordExpiringIn = (ms: number) => {
  return {
    accessToken: 'a',
    refreshToken: 'r',
    accessTokenExpiresAt: new Date(Date.now() + ms),
  };
};

describe('findExpiringTokens', () => {
  test('returns records expiring within the default 6h window', () => {
    const soon = recordExpiringIn(60 * 60 * 1000);
    const later = recordExpiringIn(24 * 60 * 60 * 1000);
    const expired = recordExpiringIn(-1000);

    const result = findExpiringTokens([soon, later, expired]);

    expect(result).toEqual([soon, expired]);
  });

  test('honours a custom window', () => {
    const soon = recordExpiringIn(60 * 60 * 1000);
    const later = recordExpiringIn(3 * 60 * 60 * 1000);

    const result = findExpiringTokens([soon, later], {
      windowMs: 90 * 60 * 1000,
    });

    expect(result).toEqual([soon]);
  });
});
