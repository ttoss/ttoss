# @ttoss/auth-core

Framework-agnostic authentication primitives for Node.js, with zero
dependencies beyond `node:crypto` (Amazon Cognito verification and generic
OIDC verification excepted).

## Installation

```bash
pnpm add @ttoss/auth-core
```

## Password hashing

PBKDF2-HMAC-SHA256 with 600,000 iterations (OWASP recommendation) and
constant-time comparison. Hashes are self-describing
(`pbkdf2-sha256$<iterations>$<salt>$<hash>`), so iterations can be raised
later without invalidating stored hashes. The legacy `salt:hash` format is
still verified for backwards compatibility.

```ts
import { comparePassword, hashPassword, needsRehash } from '@ttoss/auth-core';

const stored = await hashPassword('my-password');
const isMatch = await comparePassword('my-password', stored);

// On successful login, upgrade weak/legacy hashes:
if (isMatch && needsRehash(stored)) {
  await saveHash(await hashPassword('my-password'));
}
```

## JWT (HS256)

Sign and verify JWTs for self-hosted authentication, where the application
owns the signing secret. `verifyJwt` returns `null` for malformed, badly
signed, or expired tokens.

```ts
import { signJwt, verifyJwt } from '@ttoss/auth-core';

const token = signJwt({
  payload: { sub: 'user_123', email: 'user@example.com' },
  secret: process.env.JWT_SECRET,
  expiresInSeconds: 60 * 60 * 24 * 7, // 7 days
});

const payload = verifyJwt({ token, secret: process.env.JWT_SECRET });
```

For Amazon Cognito tokens, use `@ttoss/auth-core/amazon-cognito`, which
re-exports [`aws-jwt-verify`](https://github.com/awslabs/aws-jwt-verify).

For any other standards-compliant OIDC provider (Entra ID, Okta, Auth0,
Google, …), use `@ttoss/auth-core/oidc` — see [OIDC](#oidc) below.

## OIDC

`createOidcVerifier` builds a token verifier for any OIDC provider with no
manual JWKS wiring: it fetches the provider's `/.well-known/openid-configuration`
document to discover its signing keys, caches them, handles key rotation
transparently, and verifies the token's signature, issuer, and expiry.

```ts
import { createOidcVerifier } from '@ttoss/auth-core/oidc';

const verifyToken = createOidcVerifier({
  issuer: 'https://login.microsoftonline.com/<tenant>/v2.0',
});

const payload = await verifyToken(bearerToken);
```

Audience / resource-indicator validation is intentionally left to the
caller — the expected audience is a property of the resource server, not the
identity provider. When wiring this into `@ttoss/http-server-mcp`, pass
`resourceIndicator` alongside `verifyToken`:

```ts
import { createOidcVerifier } from '@ttoss/auth-core/oidc';
import { createMcpRouter } from '@ttoss/http-server-mcp';

const mcpRouter = createMcpRouter(mcpServer, {
  auth: {
    verifyToken: createOidcVerifier({
      issuer: 'https://login.microsoftonline.com/<tenant>/v2.0',
    }),
    resourceIndicator: 'https://mcp.example.com',
  },
});
```

Create one verifier at startup and reuse it across requests — discovery and
the JWKS cache are scoped to the verifier instance, not the process.

## One-time tokens

Building block for magic links, email verification, and password reset.
Store only `tokenHash` and `expires`; send `token` to the user and destroy
the record after a successful verification.

```ts
import { generateOneTimeToken, verifyOneTimeToken } from '@ttoss/auth-core';

const { token, tokenHash, expires } = generateOneTimeToken({
  expiresInSeconds: 60 * 60, // 1 hour, e.g. for password reset
});

// later, when the user clicks the link:
const isValid = verifyOneTimeToken({ token: received, tokenHash, expires });
```

Pass `format: 'numeric'` for a short code the user retypes from their email
instead of a link they click. Digits are drawn by rejection sampling so the
keyspace stays uniform, and the lifetime defaults to 10 minutes rather than 24
hours because ~20 bits of entropy makes a long window a guessing window.

```ts
const { token, tokenHash, expires } = generateOneTimeToken({
  format: 'numeric',
  digits: 6, // default; 4 to 12 supported
});
```

A short code is only safe with a bounded attempt count, which
`createEmailAuthHandlers` below enforces. Rolling your own means bounding the
guesses yourself.

## Email and password flows

`createEmailAuthHandlers` composes the primitives above into the credential
flows an application actually mounts — password sign-up and sign-in, magic
links, mailed numeric codes, address confirmation, and password reset. It stays
true to the package's contract: no database and no mail transport. Persistence
arrives as stores, session minting as `issueSession`, and delivery as
`sendEmail`, which receives the plaintext token exactly once and sends it with
whichever provider the application already uses.

`modes` decides which flows exist, so an application that only signs users in
with a mailed code never exposes a password endpoint.

```ts
import { createEmailAuthHandlers } from '@ttoss/auth-core';

const handlers = createEmailAuthHandlers({
  modes: ['emailCode'],

  userStore: {
    findByEmail: (email) => db.User.findOne({ where: { email } }),
    create: ({ email, passwordHash, emailVerified }) =>
      db.User.create({ email, passwordHash, emailVerified }),
    update: ({ id, ...changes }) => db.User.update(changes, { where: { id } }),
  },

  oneTimeTokenStore: {
    /* save, find, findByEmail, delete, deleteFor, incrementAttempts */
  },

  issueSession: (user) => issueSession(user),

  sendEmail: async ({ to, purpose, token, url, expires }) => {
    await ses.send(buildAuthEmail({ to, purpose, token, url, expires }));
  },

  baseUrl: process.env.APP_URL,
  ttl: { emailCode: 60 * 10 },
  emailCode: { digits: 6, maxAttempts: 5 },

  hooks: {
    onUserCreated: (user) => createDefaultWorkspace(user),
    enrichSession: ({ session, user }) => ({
      ...session,
      plan: planFor(user),
    }),
  },
});
```

Each handler takes a normalized request and resolves to a status and a body, so
it is mountable on any runner. For Koa, `emailAuth()` from
[`@ttoss/http-server-auth`](https://ttoss.dev/docs/modules/packages/http-server-auth)
does it for you.

Every handler returns expected outcomes as responses — `invalid_credentials`,
`invalid_token`, `expired_token`, `too_many_attempts` and friends, under a
stable `error.code`. Only genuinely unexpected failures throw, `sendEmail`
included, so a delivery outage reaches the application's error reporting rather
than being folded into a 200.

Two behaviours are deliberate and worth knowing before you diff them against
your own implementation. The endpoints that mail something always return the
same acknowledgement whether or not the address is on file, so the response
cannot be used to enumerate accounts; and sign-in runs a decoy PBKDF2 compare
for an unknown address, so response time cannot either.

## API tokens

Personal access tokens in the form `<prefix>_<hex>`, recognizable in logs and
secret scanners. Show the plain token once; persist only the SHA-256 hash and
a short display prefix.

```ts
import { generateApiToken, verifyApiToken } from '@ttoss/auth-core';

const { token, tokenHash, displayPrefix } = generateApiToken({
  prefix: 'myapp',
});

const isValid = verifyApiToken({
  token: received,
  tokenHash,
  expiresAt: storedExpiresAt, // optional
});
```

## Encryption at rest

AES-256-GCM helpers for storing sensitive values (e.g., third-party API
keys) in a database. The ciphertext is a single base64 string containing
the IV, auth tag, and payload. Decryption throws on a wrong key or
tampered ciphertext.

```ts
import {
  decryptValue,
  encryptValue,
  generateEncryptionKey,
} from '@ttoss/auth-core';

// Generate once and store in a secret manager:
const key = generateEncryptionKey(); // 64-char hex (32 bytes)

const ciphertext = encryptValue({ plaintext: 'third-party-api-key', key });
const plaintext = decryptValue({ ciphertext, key });
```

## Webhook signatures

HMAC-SHA256 payload signing using the common `sha256=<hex>` header
convention (e.g., GitHub's `X-Hub-Signature-256`), with constant-time
verification on the receiving side.

```ts
import {
  generateWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature,
} from '@ttoss/auth-core';

// Sender:
const secret = generateWebhookSecret();
const signature = signWebhookPayload({ payload: body, secret });
// send as a header, e.g. `X-Myapp-Signature: ${signature}`

// Receiver:
const isValid = verifyWebhookSignature({ payload: body, secret, signature });
```

## Encoding helpers

```ts
import { decode, encode } from '@ttoss/auth-core';

const encoded = encode({ id: 1 }); // base64 JSON
const obj = decode(encoded);
```

## OAuth 2.1 authorization server

`createOAuthHandlers` is a **runner-agnostic** OAuth 2.1 authorization-server engine: it implements the authorize/token/register flow and discovery metadata (RFC 8414, 7591, 7636, 6749, 9728) on top of the PKCE/code/JWT primitives above. It operates on plain `{ query, body, headers }` → `{ status, body, redirect }` objects, with no HTTP framework coupling, so any runtime (Koa, AWS Lambda, GraphQL) can host it through a thin adapter — [`@ttoss/http-server-auth`](https://ttoss.dev/docs/modules/packages/http-server-auth) ships the Koa one as `oauthServer()`.

```ts
import { createOAuthHandlers } from '@ttoss/auth-core';

const oauth = createOAuthHandlers({
  issuer,
  clientStore,
  authCodeStore,
  issueTokens,
  onAuthorize,
});
const res = await oauth.token({ query: {}, body, headers }); // { status, body }
```

Your app keeps its user model, signing keys, and login/consent UI behind the hooks. See the [OAuth Authorization Server](https://ttoss.dev/docs/engineering/guidelines/oauth-authorization-server) guideline for the full flow.

### Refresh token rotation

`createRefreshRotation` implements opaque, server-stored refresh tokens with OAuth 2.1 rotation against any `RefreshTokenStore`: single use, expiry, scope narrowing, and reuse detection (replaying a rotated token revokes the owner's whole token set). Only token hashes are persisted. Wire `issue` into `issueTokens` and pass the ready `onRefreshToken` straight through.

```ts
import { createRefreshRotation } from '@ttoss/auth-core';

const refresh = createRefreshRotation({ store: refreshTokenStore });

createOAuthHandlers({
  // …,
  issueTokens: async ({ subject, scopes, client }) => ({
    accessToken: signJwt({
      payload: { sub: subject },
      secret,
      expiresInSeconds: 3600,
    }),
    refreshToken: await refresh.issue({ client, subject, scopes }),
    expiresIn: 3600,
  }),
  onRefreshToken: refresh.onRefreshToken,
});
```

### Opaque access tokens

`createAccessTokenVerifier` verifies opaque, server-stored access tokens (and long-lived personal API keys) against any `AccessTokenStore`. Tokens are stored **hash-at-rest** — only the SHA-256 hash crosses the store boundary, so a store compromise leaks nothing usable. Verification is **default-deny** (an unknown or expired token returns `null` without revealing whether it ever existed) and **revocation is immediate** (a token removed via `delete`/`deleteBySubject` fails the next call). Mint the opaque value with `generateApiToken`; its default hashing matches the verifier, so no extra wiring is needed.

```ts
import { createAccessTokenVerifier, generateApiToken } from '@ttoss/auth-core';

// Issue: persist only the hash; show the plain token to the user once.
const { token, tokenHash } = generateApiToken({ prefix: 'myapp' });
await store.save({
  tokenHash,
  subject: 'user_123',
  scopes: ['read'],
  clientId,
  expiresAt: Date.now() + 3600_000, // null = never expires (personal API keys)
});

// Verify (e.g. inside an MCP/HTTP auth layer).
const verify = createAccessTokenVerifier({ store, touchLastUsed: true });
const identity = await verify(bearerToken); // VerifiedAccessToken | null
```

Prefer short-lived signed JWT access tokens (`signJwt`/`verifyJwt`) with refresh rotation when statelessness matters; reach for the opaque store when you need revocable access tokens or API keys.

`StoredAccessToken` carries two optional display fields useful for token-management UIs:

- `displayPrefix` — a masked safe-to-show value (e.g. `"oca_3f2a…"`) generated by `generateApiToken`, so users can identify a token without exposing the full secret.
- `createdAt` — Unix timestamp (ms) when the token was issued, for sorted listing.

`AccessTokenStore` also accepts an optional `listBySubject(subject)` method. When implemented, it enables listing all active tokens for a user — useful for "Your active sessions" or "Personal access tokens" management pages.

```ts
const tokens = await store.listBySubject!('user_123');
// [{ tokenHash, displayPrefix, createdAt, expiresAt, scopes, … }, …]
```

### Consent-redirect enrichment

`createRedirectConsentOnAuthorize` accepts two optional parameters for enriching the consent-screen redirect URL with client display data:

- `clientStore` — fetches the registered `OAuthClient` record by `client_id`. When found, `client_name` and `logo_uri` fields are appended as query parameters so the consent screen can display them without a separate API call.
- `getClientDisplayFallback` — called with `{ clientId, client? }` when the registered record is absent or missing display fields. Return a partial `ClientDisplay` (`{ clientName?, logoUri? }`) to fill the gaps. Consumer-owned — ttoss never hard-codes client display data.

```ts
import {
  createRedirectConsentOnAuthorize,
  type ClientDisplay,
} from '@ttoss/auth-core';

const onAuthorize = createRedirectConsentOnAuthorize({
  consentUrl: 'https://app.example.com/consent',
  getConsentGrant,
  deleteConsentGrant,
  clientStore,
  getClientDisplayFallback: ({ clientId }): ClientDisplay => ({
    clientName: clientNames[clientId],
    logoUri: clientLogos[clientId],
  }),
});
```

### In-memory reference stores

`createMemoryClientStore`, `createMemoryAuthCodeStore`, `createMemoryRefreshTokenStore`, and `createMemoryAccessTokenStore` are `Map`-backed implementations of the store contracts — for tests, local development, and examples. Production swaps in a durable backend behind the same interfaces.

`createMemoryAccessTokenStore` implements `listBySubject` and round-trips `displayPrefix`/`createdAt` for tests and local development.

`createMemoryUserStore` and `createMemoryOneTimeTokenStore` do the same for the email and password flows, including the attempt counting the `emailCode` mode requires — useful as a reference when implementing the contracts against a real database.
