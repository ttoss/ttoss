# @ttoss/oauth-client

Reusable client for connecting a ttoss app to third-party OAuth 2.0 providers
(TikTok, Instagram, YouTube, Google, …). It covers building the authorization
URL, exchanging the callback code, and keeping access tokens fresh through lazy
and scheduled refresh. The client is **ORM- and storage-agnostic**: it operates
on plain token objects and delegates persistence to you, so it works with
Sequelize, Prisma, or anything else.

See the [OAuth Client guideline](https://ttoss.dev/docs/engineering/guidelines/oauth-third-party-client)
for the full end-to-end pattern (endpoints, scheduled jobs, internal token access).

## Install

```bash
pnpm add @ttoss/oauth-client
```

## Generic core

`createOAuthClient` builds a client for any provider. Parameter-name overrides
absorb providers that deviate from RFC 6749.

```typescript
import { createOAuthClient } from '@ttoss/oauth-client';

const client = createOAuthClient({
  authorizationUrl: 'https://provider.example/authorize',
  tokenUrl: 'https://provider.example/token',
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

// 1. Redirect the user to the provider
const url = client.buildAuthUrl({
  redirectUri: 'https://app.example/callback',
  scope: ['read', 'write'],
  state: crypto.randomBytes(16).toString('hex'), // persist & verify on callback
});

// 2. Exchange the callback code for tokens
const tokens = await client.exchangeCode({
  code,
  redirectUri: 'https://app.example/callback',
});
```

## Provider presets

Presets pre-configure a provider's quirks. TikTok, for example, names the client
id `client_key` and uses comma-separated scopes — the preset encodes both.

```typescript
import { createTikTokClient } from '@ttoss/oauth-client';

const tiktok = createTikTokClient({
  clientKey: process.env.TIKTOK_CLIENT_KEY!,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
});
```

Adding a provider is one new preset over the same core; nothing else changes.

## Keeping tokens fresh

`getValidToken` returns a usable access token, refreshing first if it expires
within `refreshWindowMs` (default 2h). `onRefresh` receives the new tokens so you
can persist them.

```typescript
const accessToken = await client.getValidToken(record, {
  onRefresh: async (updated) => {
    await saveToken(record.id, updated);
  },
});
```

`findExpiringTokens` powers a scheduled job that proactively refreshes tokens
expiring within a wider window (default 6h), keeping connections alive for
inactive users.

```typescript
import { findExpiringTokens } from '@ttoss/oauth-client';

const expiring = findExpiringTokens(await loadAllTokens());
await Promise.all(expiring.map(refreshOne));
```

## Encryption at rest

Access and refresh tokens are credentials — **encrypt them at rest**. The package
stays encryption-agnostic and works with plaintext records; encrypt at the
storage boundary with [`@ttoss/auth-core`](https://ttoss.dev/docs/modules/packages/auth-core):

```typescript
import { decryptValue, encryptValue } from '@ttoss/auth-core';

const KEY = process.env.TOKEN_ENCRYPTION_KEY!; // from generateEncryptionKey()

const accessToken = await client.getValidToken(
  {
    accessToken: decryptValue({ ciphertext: row.accessToken, key: KEY }),
    refreshToken: decryptValue({ ciphertext: row.refreshToken, key: KEY }),
    accessTokenExpiresAt: row.accessTokenExpiresAt,
  },
  {
    onRefresh: async (updated) => {
      await row.update({
        accessToken: encryptValue({ plaintext: updated.accessToken, key: KEY }),
        refreshToken: encryptValue({
          plaintext: updated.refreshToken,
          key: KEY,
        }),
        accessTokenExpiresAt: new Date(Date.now() + updated.expiresIn * 1000),
      });
    },
  }
);
```

## API

| Export                      | Purpose                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `createOAuthClient`         | Build a client for a generic `OAuthProvider`.                    |
| `createTikTokClient`        | Preset for TikTok Login Kit.                                     |
| `client.buildAuthUrl`       | Build the provider's authorization URL.                          |
| `client.exchangeCode`       | Exchange an authorization code for tokens.                       |
| `client.refreshAccessToken` | Refresh an access token from a stored refresh token.             |
| `client.getValidToken`      | Return a valid token, refreshing lazily within a safety window.  |
| `findExpiringTokens`        | Filter records expiring within a window (for scheduled refresh). |
