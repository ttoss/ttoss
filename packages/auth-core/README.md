# @ttoss/auth-core

Framework-agnostic authentication primitives for Node.js, with zero
dependencies beyond `node:crypto` (Amazon Cognito verification excepted).

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

`createOAuthHandlers` is a **runner-agnostic** OAuth 2.1 authorization-server engine: it implements the authorize/token/register flow and discovery metadata (RFC 8414, 7591, 7636, 6749, 9728) on top of the PKCE/code/JWT primitives above. It operates on plain `{ query, body, headers }` → `{ status, body, redirect }` objects, with no HTTP framework coupling, so any runtime (Koa, AWS Lambda, GraphQL) can host it through a thin adapter — [`@ttoss/http-server`](https://ttoss.dev/docs/modules/packages/http-server) ships the Koa one as `oauthServer()`.

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
