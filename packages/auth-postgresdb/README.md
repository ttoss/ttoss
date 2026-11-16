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

export const {
  clientStore,
  authCodeStore,
  consentStore,
  pendingAuthorizationStore,
  refreshTokenStore,
} = createPostgresdbOAuthStores({ db });
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

Each store is also exported on its own (`createClientStore`, `createAuthCodeStore`, `createConsentStore`, `createPendingAuthorizationStore`, `createRefreshTokenStore`) for apps that register only some of the models.

## Schema

| Model                       | Table                          | Primary key      |
| --------------------------- | ------------------------------ | ---------------- |
| `OAuthClient`               | `oauth_clients`                | `client_id`      |
| `OAuthAuthCode`             | `oauth_auth_codes`             | `code_hash`      |
| `OAuthConsent`              | `oauth_consents`               | `code_challenge` |
| `OAuthPendingAuthorization` | `oauth_pending_authorizations` | `id`             |
| `OAuthRefreshToken`         | `oauth_refresh_tokens`         | `token_hash`     |

Every credential — authorization codes (`code_hash`), refresh tokens (`token_hash`), and client secrets (`client_secret_hash`) — is stored by SHA-256 hash, never in plaintext, so a database dump yields nothing replayable. `OAuthClient` keeps the registered RFC 7591 fields in their own columns and any additional submitted metadata in a `metadata` JSONB column, so a registration document round-trips unchanged.

## Four traps these adapters absorb

**Authorization codes are hashed at rest.** `AuthCodeStore.get` is handed the plaintext code, but a code travels through a browser redirect and a client's URL bar. The engine never compares the returned `code` against anything — it reads only `clientId`, `redirectUri`, `codeChallenge`, `scopes`, `subject`, and `expiresAt` — so the adapter hashes to find the row and echoes the presented value back.

**Client secrets are hashed at rest too, which takes a different mechanism.** A secret _is_ compared, so the adapter cannot simply hash the row away and echo the presented value back. Instead `clientStore` implements `ClientStore.verifyClientSecret`: the engine hands over the presented secret and the store compares it against the stored hash in constant time, so the raw value never has to be recoverable. Consequently `get` omits `client_secret` from the document it returns — nothing in the engine needs it, since the registration response echoes the secret from the document it just generated rather than from a read.

Implementing `verifyClientSecret` is what makes hashing possible at all. A store that omits it falls back to the engine comparing the `client_secret` returned by `get`, which forces the store to keep the secret recoverable — plaintext, or encrypted with a key the app has to manage.

**A live refresh token reports no `consumedAt` at all.** `createRefreshRotation` treats `stored.consumedAt !== undefined` as reuse. A nullable timestamp column reads back as `null`, which is `!== undefined`, so a naive adapter makes every live token look consumed: the first refresh is treated as a replay and revokes the owner's entire token set — "refresh works once, then the client must re-authorize forever". The adapter omits the key instead of setting it to `null`.

**Refresh-token single use is one conditional `UPDATE`.** `consume` runs `UPDATE oauth_refresh_tokens SET consumed_at = $at WHERE token_hash = $1 AND consumed_at IS NULL` and returns whether a row changed, so of two concurrent refreshes with the same token only one wins; rotation treats the other as reuse and revokes the owner's chain.

## Consent

`consentStore` satisfies the `ConsentGrantStore` that `createRedirectConsentOnAuthorize` consumes, and adds `saveConsentGrant` for the write your consent page performs on approval. It is the single-use handoff keyed by the PKCE `code_challenge` — not a durable "user X trusts client Y" record, which is an app-level authorization decision and belongs in your own schema.

`pendingAuthorizationStore` backs `createPendingConsentOnAuthorize`, the server-held consent flow. Prefer it: the screen reads the request by an opaque id, never from its own URL, and an approval is redeemable only by the approver's resume secret. Its `approve` is one conditional `UPDATE`, `consume` hands the row only to the caller whose `DELETE` removed it, and `delete` (deny) leaves an approved row alone.

## Related

- [OAuth Authorization Server](https://ttoss.dev/docs/engineering/guidelines/oauth-authorization-server) — the full server setup and the ttoss-vs-app responsibility split
- [MCP Server with OAuth](https://ttoss.dev/docs/engineering/guidelines/mcp-server-oauth) — the MCP application of these primitives
- [`@ttoss/postgresdb`](https://ttoss.dev/docs/modules/packages/postgresdb) — `initialize`, and the `sync` / `erd` CLI
