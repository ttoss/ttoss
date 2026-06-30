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
