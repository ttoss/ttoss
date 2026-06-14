# @ttoss/http-server-oauth

OAuth 2.1 plugin for [@ttoss/http-server](https://ttoss.dev/docs/modules/packages/http-server). A thin Koa adapter over the runner-agnostic OAuth engine in [@ttoss/auth-core](https://ttoss.dev/docs/modules/packages/auth-core), so the base `@ttoss/http-server` runner stays free of auth dependencies — you add OAuth only when you need it.

## Installation

```bash
pnpm add @ttoss/http-server @ttoss/http-server-oauth
```

## Issuing tokens — `oauthServer()`

Mounts an OAuth 2.1 Authorization Server (`/authorize`, `/token`, `/register`, discovery metadata) as a Koa `Router`. The app keeps its user model, signing keys, and login/consent UI behind hooks.

```typescript
import { App, bodyParser } from '@ttoss/http-server';
import { oauthServer } from '@ttoss/http-server-oauth';

const app = new App();
app.use(bodyParser());
app.use(
  oauthServer({
    issuer: 'https://api.example.com',
    clientStore, // { get(clientId), register(client) }
    authCodeStore, // { save(code), get(code), delete(code) }
    issueTokens: async ({ subject, scopes }) => ({
      accessToken: signJwt({ sub: subject, scope: scopes.join(' ') }),
      expiresIn: 3600,
    }),
    onAuthorize: async ({ headers, request }) => {
      const session = await getSession(headers.cookie);
      if (!session) return { approved: false, redirect: '/login' };
      return {
        approved: true,
        subject: session.userId,
        scopes: request.scopes,
      };
    },
  }).routes()
);
```

## Verifying tokens — `oauthVerify()`

Resource-server middleware. Verifies the `Authorization: Bearer` token, returns `401`/`403`, and stores the verified payload on `ctx.state.identity`.

```typescript
import { oauthVerify } from '@ttoss/http-server-oauth';

// Cognito
app.use(oauthVerify({ cognitoUserPool: { userPoolId, clientId } }));

// Custom verifier + scope guard
app.use(
  oauthVerify({
    verifyToken: async (t) => myJwt.verify(t),
    requiredScopes: ['read'],
  })
);
```

## Exports

- **`oauthServer(options)`** — authorization-server `Router` (issues tokens)
- **`oauthVerify(options)`** — resource-server middleware (verifies tokens)
- **`createProtectedResourceMetadataMiddleware({ resource, authorizationServers })`** — serves RFC 9728 metadata
- **`createOAuthHandlers`**, **`getWwwAuthenticateHeader`**, and the OAuth types — re-exported from `@ttoss/auth-core`

See the [OAuth Authorization Server](https://ttoss.dev/docs/engineering/guidelines/oauth-authorization-server) guideline for the full flow and the ttoss-vs-app responsibility split.
