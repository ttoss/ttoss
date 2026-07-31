# Contributing to `@ttoss/auth-core`

## Architecture — the rules

`@ttoss/auth-core` is **runner-agnostic** and has **no database dependency**: it
defines store/hook contracts and ships the security mechanics, while the
consumer injects persistence (`query`, a `*Store`) and minting (`issueTokens`).
Two invariants hold across the package:

1. **Secrets are stored hashed, never in usable form.** Refresh tokens
   (`refreshTokenRotation.ts`), API tokens (`apiToken.ts`), one-time tokens, and
   access tokens all persist a SHA-256 hash and compare/look up by hash. A store
   compromise must yield nothing replayable.
2. **The interface enforces the invariant, not the docs.** A store boundary that
   only accepts a `tokenHash` makes persisting a usable secret impossible — that
   is preferred over a plaintext-capable API that documentation merely warns
   against.

When code diverges from a spec or an "obvious best practice", treat it as
evidence of an unstated invariant — investigate before changing.

## Decisions (ADRs)

Canonical trade-off record. Code references use `@adr ADR-NNN — <one-line reason>`
in JSDoc, linking to the heading here.

**Entry gate** — all three required: a reasonable alternative was rejected; the
chosen path has a visible cost; a reviewer without context will propose the
alternative. Otherwise → JSDoc on the symbol.

**Lifecycle** — IDs sequential, never reused; append only; never delete.
Superseded entries: keep the ID, add `Status: superseded-by:ADR-NNN`.

### ADR format (mandatory, fixed field order)

One line per bullet. No prose unless a single sentence is insufficient. Empty
field → `—`.

```
### ADR-NNN: <Short title>

Status: accepted | superseded-by:ADR-MMM | deprecated  (YYYY-MM-DD)
Tags: <comma-separated keywords>

Decision: <one sentence — what was chosen>.
Rejected: <Alt A — one-line reason>; <Alt B — one-line reason>.
Cost: <the visible price we pay — one line>.
Anchors: `file.ts`, ...

Re-litigation answers:
- <recurring question> → <one-line answer>.
```

### Records

_Append new entries below this line. Newest at the bottom._

### ADR-001: Access tokens are opaque and stored hash-at-rest, not plaintext or JWT-only

Status: accepted (2026-06-27)
Tags: access-tokens, api-keys, hash-at-rest, revocation, oauth

Decision: ship an `AccessTokenStore` keyed by SHA-256 hash plus a default-deny `createAccessTokenVerifier`, so persisted access tokens and personal API keys are opaque, revocable, and never stored in usable form; JWT access tokens stay available via `signJwt`/`verifyJwt`.
Rejected: plaintext `token` column with `WHERE token = $1` — a store dump leaks usable credentials and diverges from the `RefreshTokenStore`/`apiToken` hash-at-rest precedent; JWT-only access tokens — already supported and cannot be revoked before expiry, so the opaque store is the missing path, not a replacement; a plaintext-in store made configurable per consumer schema — pushes consumer-specific concerns (`readOnly`, integer `user_id`) into the generic surface.
Cost: a consumer holding a plaintext `oauth_access_tokens` column must backfill `token_hash` and switch lookups (a migration), and every verification is a store read whose hot path must default-deny and never fail-open.
Anchors: `src/oauthServerTypes.ts` (`AccessTokenStore`, `StoredAccessToken`), `src/createAccessTokenVerifier.ts`, `src/memoryStores.ts` (`createMemoryAccessTokenStore`), `src/apiToken.ts`, `src/refreshTokenRotation.ts`.

Re-litigation answers:

- "Why not JWT access tokens?" → already shipped via `signJwt`/`verifyJwt`; this fills the opaque + revocable gap so ttoss covers both topologies.
- "Why store another secret?" → only the hash is stored; a dump yields nothing usable, and you gain instant revocation and unforgeability.
- "Why a hash-keyed interface instead of a plaintext column + override?" → secure by construction: `save({ tokenHash })` makes persisting a usable secret impossible, not merely discouraged.
- "Why `deleteBySubject`, not `deleteByOwner({ clientId, subject })`?" → "revoke all of a user's access" is the security-critical operation; per-client revocation is a local addition when a consumer needs it.
- "Why doesn't the verifier sweep expired tokens?" → keeps the verify path read-only for read-replica deployments; expiry cleanup is a separate concern (DB TTL / cron).
- "Why allow `expiresAt: null`?" → explicit opt-in for long-lived personal API keys; OAuth access-token issuance should always set a TTL.

### ADR-002: Email delivery is a `sendEmail` callback, not a mail-transport dependency

Status: accepted (2026-07-29)
Tags: email-auth, magic-link, email-code, delivery, dependencies

Decision: `createEmailAuthHandlers` mints and persists the token, then hands the plaintext to an app-provided `sendEmail(delivery)` exactly once, so the package composes the flows without depending on any mail SDK.
Rejected: a `@ttoss/mailer` package wrapping Resend/SES — a thin re-export of provider SDKs that adds a dependency and a version to maintain while every consumer already has a configured client; templates shipped from this package — brand, copy, and i18n are application concerns and each consumer would immediately override them; `nodemailer` as a universal transport — pulls SMTP into a package whose whole point is having no I/O.
Cost: two consumers each write their own template and send call, so a bug in one is not fixed in the other, and the package cannot verify that delivery actually happened.
Anchors: `src/emailAuthTypes.ts` (`EmailAuthDelivery`, `EmailAuthOptions.sendEmail`), `src/emailAuth.ts` (`issueToken`).

Re-litigation answers:

- "Why not just ship a Resend and an SES transport?" → the flows are the reusable part; the transports are one `await client.send(...)` line each in an app that already configures the client.
- "How does the app know what to put in the email?" → `EmailAuthDelivery` carries `purpose`, `token`, `url`, `expires`, and the user, which is everything a template needs.
- "Why does the engine not catch a delivery failure?" → the token stays persisted and the throw reaches the app's existing error reporting, so a retry is safe and an outage is visible rather than swallowed into a 200.

### ADR-003: Short numeric codes are a token format, gated on a bounded attempt count

Status: accepted (2026-07-29)
Tags: email-code, one-time-token, brute-force, rejection-sampling

Decision: `generateOneTimeToken({ format: 'numeric', digits })` produces a rejection-sampled decimal code defaulting to 6 digits and a 10-minute lifetime, and `createEmailAuthHandlers` refuses to start in `emailCode` mode unless the store implements `findByEmail` and `incrementAttempts`.
Rejected: a separate `generateNumericCode` primitive — the hash-at-rest and expiry mechanics are identical, so a second surface would duplicate them; treating a code like any other one-time token — ~20 bits is guessable within a long TTL, so shipping it without attempt counting would be insecure by default; counting attempts by token hash alone — a wrong guess hashes to nothing on record, so there is no row to charge the attempt to.
Cost: the store contract carries an `attempts` column and an email-keyed lookup that the link flows never use, and the `numeric` format defaults to a different TTL than `hex`, which is a documented asymmetry rather than an obvious one.
Anchors: `src/oneTimeToken.ts` (`randomDigits`, `NUMERIC_REJECTION_CEILING`), `src/emailAuthTypes.ts` (`OneTimeTokenStore.findByEmail`, `incrementAttempts`), `src/emailAuth.ts` (`verifyEmailCode`).

Re-litigation answers:

- "Why reject bytes ≥ 250 instead of `byte % 10`?" → plain modulo over `0-255` over-produces `0-5` by about 20%, which measurably shrinks the keyspace.
- "Why does a wrong code look up by email rather than by its hash?" → so the failure can be charged to the outstanding record; a hash lookup of a wrong guess finds nothing and can count nothing.
- "Why destroy the code at `maxAttempts` instead of just refusing?" → refusing while the record lives lets an attacker keep guessing until expiry; destroying it forces a fresh code with a fresh keyspace.
- "Why a different default TTL for `numeric`?" → the smaller keyspace makes a long window a guessing window; 24 hours is safe for 32 random bytes and not for 6 digits.

### ADR-004: The send cap counts requests, not deliveries

Status: accepted (2026-07-29)
Tags: email-auth, rate-limit, enumeration, mail-bombing

Decision: `requestRateLimit` gates the "mail me something" handlers before the user lookup and records every request that passes validation, whether or not a message followed.
Rejected: recording only actual sends — an unknown address would never accumulate records and so never hit the limit, making `429` vs `200` a reliable account-existence oracle and undoing the enumeration safety the same handlers are built around; silently dropping over-limit requests and still answering `200` — indistinguishable from success, so a legitimate user who resends twice gets no explanation and no retry signal; limiting by IP instead of address — the abuse this prevents is aimed at one victim's mailbox and an attacker rotates IPs more easily than the victim changes address.
Cost: requests that send nothing still consume a record and a store write, so a hostile caller can exhaust a stranger's allowance and briefly deny them a code they never asked for — a far cheaper failure than mailing them repeatedly, but a real one.
Anchors: `src/emailAuthTypes.ts` (`RequestRateLimit`, `RequestRateLimitStore`), `src/emailAuthRuntime.ts` (`createCheckRequestRate`), `src/emailAuthLink.ts` (`createSendHandler`), `src/emailAuthCode.ts` (`sendEmailCode`).

Re-litigation answers:

- "Why is the limiter optional if it matters this much?" → it needs a store the engine cannot supply, and a package that has no I/O cannot invent shared state; the README and the option's JSDoc both say to configure it.
- "Why not reuse the `emailCode` attempt ceiling?" → that bounds guesses against one issued code; this bounds how many codes get mailed at all. Different resource, different attacker.
- "Why gate before the lookup rather than after?" → after the lookup the verdict depends on whether the account exists, which is exactly the leak.
- "Why a `429` rather than a silent 200?" → the response is uniform across known and unknown addresses, so it leaks nothing, and the caller learns to wait instead of retrying immediately.
