# @ttoss/http-server-auth

Authentication middleware for `@ttoss/http-server` (Koa). Wraps `@ttoss/auth-core` primitives into a ready-to-use Bearer-token strategy chain.

## Installation

```bash
pnpm add @ttoss/http-server-auth
```

## Usage

### Global middleware

```ts
import { authMiddleware } from '@ttoss/http-server-auth';
import { App } from '@ttoss/http-server';

const app = new App();

app.use(
  authMiddleware({
    strategies: ['jwt', 'apiToken', 'system'],

    jwt: {
      secret: process.env.JWT_SECRET,
    },

    apiToken: {
      // The second argument is the Koa `ctx`, so the lookup can do
      // request-scoped work (read `ctx.db`, bump `lastUsedAt`, etc.).
      lookup: async (tokenHash, ctx) => {
        const record = await ctx.db.ApiToken.findOne({
          where: { tokenHash, revoked: false },
        });
        if (!record) return null;
        await record.update({ lastUsedAt: new Date() });
        return { id: record.user.publicId, email: record.user.email };
      },
    },

    system: {
      secret: process.env.INTERNAL_API_SECRET,
      user: { id: 'system', email: 'system@internal' },
    },

    allowedOrigins: [
      process.env.APP_URL,
      'http://localhost:3000',
      /\.vercel\.app$/,
    ],

    required: true, // default
  })
);
```

### Per-route middleware

```ts
import { requireAuth } from '@ttoss/http-server-auth';
import { Router } from '@ttoss/http-server';

const router = new Router();

router.get(
  '/internal/revalidate',
  requireAuth({
    strategies: ['system'],
    system: { secret: process.env.INTERNAL_API_SECRET, user: { id: 'system' } },
  }),
  handler
);

router.get(
  '/me',
  requireAuth({
    strategies: ['jwt', 'apiToken'],
    jwt: { secret: process.env.JWT_SECRET },
    apiToken: { lookup },
  }),
  handler
);
```

### Optional auth

```ts
app.use(
  authMiddleware({
    strategies: ['jwt'],
    jwt: { secret: process.env.JWT_SECRET },
    required: false, // unauthenticated requests pass through with ctx.state.user === undefined
  })
);
```

## Context types

On successful authentication the middleware sets:

```ts
ctx.state.user; // AuthenticatedUser
ctx.state.authStrategy; // 'jwt' | 'apiToken' | 'system' | 'oauth'
```

```ts
type AuthenticatedUser = {
  id: string;
  email?: string;
  [key: string]: unknown;
};
```

## Behavior

1. Reads `Authorization: Bearer <token>`; missing header → 401 if `required`.
2. If `allowedOrigins` is configured and the `Origin` header doesn't match → 403. Requests without an Origin header are never rejected.
3. Tries each strategy in `strategies` order; first match wins.
   - `jwt` — verifies HS256 JWT via `@ttoss/auth-core verifyJwt`; maps `sub`/`email` to user (override with `jwt.mapPayload(payload, ctx)`).
   - `apiToken` — hashes the token (SHA-256) and calls `apiToken.lookup(hash, ctx)`.
   - `system` — constant-time comparison against `system.secret`.
   - `oauth` — verifies an OAuth provider's Bearer token via `oauth.verify(token, ctx)` (wrap Cognito/Auth0/your own verifier); maps the payload to the user (claims like `scope` are preserved on `ctx.state.user`). A verified token missing an `oauth.requiredScopes` entry yields `403`.
4. All strategies fail and `required` → 401. Failure reason is never leaked. Set `resourceMetadataUrl` to advertise the authorization server on `401` via `WWW-Authenticate` (RFC 9728).

Both `apiToken.lookup` and `jwt.mapPayload` receive the Koa `ctx` as a second argument, enabling request-scoped work (e.g. reading a per-request connection off `ctx.db` or updating `lastUsedAt`). The single-argument signatures keep working — `ctx` is purely additive.

## Email and password flows

`emailAuth()` mounts the credential flows — password sign-up and sign-in, magic
links, mailed numeric codes, address confirmation and password reset — as a Koa
`Router`. It is a thin adapter over `createEmailAuthHandlers` from
[`@ttoss/auth-core`](https://ttoss.dev/docs/modules/packages/auth-core), which
owns the mechanics; this package only maps `ctx` to and from it.

`modes` decides which routes exist, so an app that signs users in with a mailed
code alone never exposes a password endpoint.

```ts
import { App, bodyParser } from '@ttoss/http-server';
import { authMiddleware, emailAuth } from '@ttoss/http-server-auth';

const app = new App();
app.use(bodyParser());

app.use(
  emailAuth({
    modes: ['emailCode'],
    prefix: '/v1',
    userStore,
    oneTimeTokenStore,
    issueSession: (user) => issueSession(user),
    sendEmail: async ({ to, token }) => {
      await ses.send(buildCodeEmail({ to, code: token }));
    },
  }).routes()
);

// Mount after, so the sign-in routes stay reachable without a token.
app.use(authMiddleware({ strategies: ['jwt'], jwt: { secret } }));
```

Every route is a `POST`, link redemptions included: the token arrives in the body
from the page the user landed on, which keeps it out of server logs and out of
the `Referer` header. The engine also reads a token from the query string, so a
`GET` redemption is available to an app that wants one.

Mount it before `authMiddleware` (or exempt its paths) — a client calls these
routes precisely because it has no token yet. `prefix` applies to every mounted
path when the app versions its API; individual paths are overridable through
`paths`.

## OAuth authorization server

The package also ships `oauthServer()` — a Koa `Router` that issues tokens (`/authorize`, `/token`, `/register`, discovery), a thin adapter over `createOAuthHandlers` from [`@ttoss/auth-core`](https://ttoss.dev/docs/modules/packages/auth-core). Pair it with the `oauth` verification strategy above when one deployment both issues and verifies. See the [OAuth Authorization Server](https://ttoss.dev/docs/engineering/guidelines/oauth-authorization-server) guideline.
