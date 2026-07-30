# @ttoss/auth-postgresdb

Durable Postgres persistence for the OAuth 2.1 authorization server in [`@ttoss/auth-core`](https://ttoss.dev/docs/modules/packages/auth-core): the Sequelize models for the RFC data model, plus the store adapters `createOAuthHandlers`, `createRefreshRotation`, and `createRedirectConsentOnAuthorize` expect.

`@ttoss/auth-core` ships `Map`-backed stores for tests and local development; this package is what production swaps in behind the same interfaces, without reaching around your ORM to inject a raw `pg` query runner.

## Installation

```bash
pnpm add @ttoss/auth-postgresdb @ttoss/auth-core @ttoss/postgresdb
```

## Usage

Register `oauthModels` alongside your own models so `ttoss-postgresdb sync` and `erd` manage these tables like any other, then build the stores from the `db` handle:

```typescript
import {
  createPostgresdbOAuthStores,
  oauthModels,
} from '@ttoss/auth-postgresdb';
import { initialize } from '@ttoss/postgresdb';

import { User } from './models/User';

export const db = await initialize({ models: { ...oauthModels, User } });

export const { clientStore, authCodeStore, consentStore, refreshTokenStore } =
  createPostgresdbOAuthStores({ db });
```

The stores drop straight into the OAuth server:

```typescript
import { createRefreshRotation } from '@ttoss/auth-core';
import { oauthServer } from '@ttoss/http-server-auth';

const refresh = createRefreshRotation({ store: refreshTokenStore });

const authServer = oauthServer({
  issuer: 'https://api.example.com',
  clientStore,
  authCodeStore,
  onRefreshToken: refresh.onRefreshToken,
  // …issueTokens, onAuthorize…
});
```

Each store is also exported on its own (`createClientStore`, `createAuthCodeStore`, `createConsentStore`, `createRefreshTokenStore`) for apps that register only some of the models.

## Schema

| Model               | Table                  | Primary key      |
| ------------------- | ---------------------- | ---------------- |
| `OAuthClient`       | `oauth_clients`        | `client_id`      |
| `OAuthAuthCode`     | `oauth_auth_codes`     | `code_hash`      |
| `OAuthConsent`      | `oauth_consents`       | `code_challenge` |
| `OAuthRefreshToken` | `oauth_refresh_tokens` | `token_hash`     |

Credentials are stored by SHA-256 hash, never in plaintext, so a database dump yields nothing replayable. `OAuthClient` keeps the registered RFC 7591 fields in their own columns and any additional submitted metadata in a `metadata` JSONB column, so a registration document round-trips unchanged.

## Two traps these adapters absorb

**Authorization codes are hashed at rest.** `AuthCodeStore.get` is handed the plaintext code, but a code travels through a browser redirect and a client's URL bar. The engine never compares the returned `code` against anything — it reads only `clientId`, `redirectUri`, `codeChallenge`, `scopes`, `subject`, and `expiresAt` — so the adapter hashes to find the row and echoes the presented value back.

**A live refresh token reports no `consumedAt` at all.** `createRefreshRotation` treats `stored.consumedAt !== undefined` as reuse. A nullable timestamp column reads back as `null`, which is `!== undefined`, so a naive adapter makes every live token look consumed: the first refresh is treated as a replay and revokes the owner's entire token set — "refresh works once, then the client must re-authorize forever". The adapter omits the key instead of setting it to `null`.

## Consent

`consentStore` satisfies the `ConsentGrantStore` that `createRedirectConsentOnAuthorize` consumes, and adds `saveConsentGrant` for the write your consent page performs on approval. It is the single-use handoff keyed by the PKCE `code_challenge` — not a durable "user X trusts client Y" record, which is an app-level authorization decision and belongs in your own schema.

## Related

- [OAuth Authorization Server](https://ttoss.dev/docs/engineering/guidelines/oauth-authorization-server) — the full server setup and the ttoss-vs-app responsibility split
- [MCP Server with OAuth](https://ttoss.dev/docs/engineering/guidelines/mcp-server-oauth) — the MCP application of these primitives
- [`@ttoss/postgresdb`](https://ttoss.dev/docs/modules/packages/postgresdb) — `initialize`, and the `sync` / `erd` CLI
