# @ttoss/http-server

Lightweight HTTP server built on [Koa](https://koajs.com/) for the ttoss ecosystem.

## Installation

```bash
pnpm add @ttoss/http-server
```

## Quick Start

```typescript
import { App, Router, bodyParser, cors, serve } from '@ttoss/http-server';

const app = new App();

app.use(cors());
app.use(bodyParser());

const router = new Router();

router.get('/health', (ctx) => {
  ctx.body = { status: 'ok' };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Health Check Endpoint

Add a health check endpoint with a single line:

```typescript
import { App, addHealthCheck } from '@ttoss/http-server';

const app = new App();

addHealthCheck({ app });
// or with custom path: addHealthCheck({ app, path: '/healthz' });

app.listen(3000);
// GET /health returns { status: 'ok' }
```

## Core Features

### Static File Serving

Serve static files from a directory using the `serve` middleware:

```typescript
import { App, serve } from '@ttoss/http-server';

const app = new App();

// Serve files from the 'public' directory
app.use(serve('./public'));

app.listen(3000);
// Files in ./public are now accessible at http://localhost:3000
```

**Advanced Options:**

```typescript
// With custom options
app.use(
  serve('./public', {
    maxage: 3600000, // Cache files for 1 hour (in milliseconds)
    index: 'index.html', // Default file to serve for directories
    hidden: false, // Don't serve hidden files
    gzip: true, // Enable gzip compression
  })
);
```

**Combining with Routes:**

```typescript
import { App, Router, serve } from '@ttoss/http-server';

const app = new App();
const router = new Router();

// Define API routes first
router.get('/api/users', (ctx) => {
  ctx.body = [{ id: 1, name: 'John' }];
});

app.use(router.routes());

// Static files are served after API routes
app.use(serve('./public'));

app.listen(3000);
```

### Route Parameters

```typescript
router.get('/users/:id', (ctx) => {
  const { id } = ctx.params;
  ctx.body = { userId: id };
});
```

### Request Body Parsing

JSON and form-urlencoded data are automatically parsed when using `bodyParser()`:

```typescript
router.post('/users', (ctx) => {
  const userData = ctx.request.body;
  ctx.body = { created: userData };
});
```

### File Uploads

```typescript
import { multer } from '@ttoss/http-server';
import type { MulterFile } from '@ttoss/http-server';

const upload = multer();

router.post('/upload', upload.single('file'), (ctx) => {
  const file = ctx.file as MulterFile | undefined;
  ctx.body = {
    filename: file?.originalname,
    size: file?.size,
  };
});
```

### Error Handling

```typescript
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    ctx.status = error.status || 500;
    ctx.body = { error: error.message };
  }
});
```

An app with its own error envelope usually recognizes only its own error class,
so a deliberate `ctx.throw(401, 'Unauthorized', { headers })` from a library
middleware — `authMiddleware`, `createMcpRouter`'s `auth` — becomes a `500` with
the `WWW-Authenticate` header stripped. For MCP that header is the whole
[RFC 9728](https://www.rfc-editor.org/rfc/rfc9728) discovery chain: the client
gets an opaque server error where it expected the pointer to the authorization
server, so OAuth discovery never starts.

`toHttpError` normalizes a thrown value into `{ status, message, headers }` when
it is a deliberate, exposable 4xx, and `undefined` otherwise, so a genuine bug
still becomes a `500` with nothing leaked. `applyHttpErrorHeaders` copies the
headers the thrower attached onto the response — without it the status is right
but discovery is still broken.

```typescript
import { App, applyHttpErrorHeaders, toHttpError } from '@ttoss/http-server';

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof ApiError) {
      writeError(ctx, error);
      return;
    }

    const httpError = toHttpError(error);

    if (httpError) {
      applyHttpErrorHeaders({ ctx, error });
      writeError(ctx, new ApiError(httpError.status, httpError.message));
      return;
    }

    console.error('Unhandled request error:', error);
    writeError(ctx, new ApiError(500, 'internal_error'));
  }
});
```

### Localization

`i18nMiddleware` negotiates the request locale and renders [`LocalizedError`](https://ttoss.dev/docs/modules/packages/i18n-core/)s:

```ts
import { App, i18nMiddleware, type I18nState } from '@ttoss/http-server';

app.use(
  i18nMiddleware({ catalog, getUserLocale: (ctx) => ctx.state.user?.locale })
);

router.get('/summary', (ctx) => {
  const { i18n } = ctx.state as I18nState;
  ctx.body = { text: i18n.render(summaryRef) };
});
```

- `ctx.state.locale` and `ctx.state.i18n` come from `getUserLocale`, then `Accept-Language`, then the catalog's fallback.
- A client-facing `LocalizedError` (a 4xx `status`, or an expected error per [`@ttoss/errors`](https://www.npmjs.com/package/@ttoss/errors)) answers `{ error: { code, message } }` with that status (400 by default).
- Any other `LocalizedError` has its `message` rendered in place and is rethrown to your error handling; every other error passes through untouched.

### Serving a Request In-Process

`dispatchInProcess` runs one request through an app's whole middleware chain
with no socket and no port, and answers `{ status, headers, body }` as a client
would read them — a JSON body round-trips through `JSON.stringify`, so a `Date`
arrives as its ISO string. It lets one surface of an application call another
(an MCP tool calling the REST route it was generated from) without a second
implementation of validation or authorization, and without a loopback request.

```ts
import { dispatchInProcess } from '@ttoss/http-server';

const { status, body } = await dispatchInProcess({
  app,
  method: 'POST',
  path: '/api/v1/items?notify=true',
  headers: { authorization: `Bearer ${token}` },
  body: { name: 'Item' }, // sent as JSON
});
```

An unmatched route answers `404` with `Not Found`, and an error that escapes
the middleware answers as Koa would — its `status` (or `500`), with its message
only when `expose` is set — and is emitted on the app's `error` event if it has
a listener. A streamed response body is not supported.

## OAuth

Authentication lives in [`@ttoss/http-server-auth`](https://ttoss.dev/docs/modules/packages/http-server-auth) — `authMiddleware` (verify Bearer tokens, including an `oauth` strategy) and `oauthServer()` (issue tokens), a thin Koa layer over the runner-agnostic engine in [`@ttoss/auth-core`](https://ttoss.dev/docs/modules/packages/auth-core). This base runner stays auth-free. See the [OAuth Authorization Server](https://ttoss.dev/docs/engineering/guidelines/oauth-authorization-server) guideline.

## API Reference

All exports are re-exported from established Koa ecosystem packages:

- **`App`** - [Koa application](https://github.com/koajs/koa)
- **`Router`** - [Koa router](https://github.com/koajs/router) for routing
- **`bodyParser`** - [Koa body parser](https://github.com/koajs/bodyparser) for JSON/form parsing
- **`cors`** - [Koa CORS](https://github.com/koajs/cors) for cross-origin requests
- **`multer`** - [Koa multer](https://github.com/koajs/multer) for file uploads
- **`serve`** - [Koa static](https://github.com/koajs/static) for serving static files
- **`dispatchInProcess({ app, method, path, headers?, body? })`** - Serves one request through the app's middleware chain without a socket; resolves to `{ status, headers, body }`
- **`addHealthCheck({ app, path? })`** - Adds a health endpoint (defaults to `/health`) returning `{ status: 'ok' }`
- **`toHttpError(error)`** - Normalizes a deliberate, exposable 4xx into `{ status, message, headers }`; `undefined` for anything else
- **`applyHttpErrorHeaders({ ctx, error })`** - Copies headers attached to a thrown error onto the response (e.g. `WWW-Authenticate`)
- **`NormalizedHttpError`** (type) - Return shape of `toHttpError`
- **`MulterFile`** (type) - File type for uploaded files
- **`RouterContext<StateT, ContextT>`** (type) - Generic Koa router context for type-safe route handlers
