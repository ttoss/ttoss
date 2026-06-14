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

## OAuth (opt-in)

OAuth is an opt-in feature you enable by passing options — there is no separate package. The runner-agnostic OAuth 2.1 engine lives in [`@ttoss/auth-core`](https://ttoss.dev/docs/modules/packages/auth-core); this package ships the Koa adapters.

```typescript
import { App, bodyParser, oauthServer, oauthVerify } from '@ttoss/http-server';

const app = new App();
app.use(bodyParser());

// Issue tokens (authorization server): mount the endpoints
app.use(
  oauthServer({
    issuer,
    clientStore,
    authCodeStore,
    issueTokens,
    onAuthorize,
  }).routes()
);

// Verify tokens (resource server): protect downstream routes
app.use(oauthVerify({ verifyToken, requiredScopes: ['read'] }));
```

See the [OAuth Authorization Server](https://ttoss.dev/docs/engineering/guidelines/oauth-authorization-server) guideline for the full flow and the ttoss-vs-app responsibility split.

## API Reference

All exports are re-exported from established Koa ecosystem packages:

- **`App`** - [Koa application](https://github.com/koajs/koa)
- **`Router`** - [Koa router](https://github.com/koajs/router) for routing
- **`bodyParser`** - [Koa body parser](https://github.com/koajs/bodyparser) for JSON/form parsing
- **`cors`** - [Koa CORS](https://github.com/koajs/cors) for cross-origin requests
- **`multer`** - [Koa multer](https://github.com/koajs/multer) for file uploads
- **`serve`** - [Koa static](https://github.com/koajs/static) for serving static files
- **`addHealthCheck({ app, path? })`** - Adds a health endpoint (defaults to `/health`) returning `{ status: 'ok' }`
- **`MulterFile`** (type) - File type for uploaded files
- **`RouterContext<StateT, ContextT>`** (type) - Generic Koa router context for type-safe route handlers

OAuth adapters (see [OAuth](#oauth-opt-in)):

- **`oauthServer(options)`** - Authorization-server `Router` (issues tokens): `/authorize`, `/token`, `/register`, discovery
- **`oauthVerify(options)`** - Resource-server middleware (verifies Bearer tokens; sets `ctx.state.identity`)
- **`createProtectedResourceMetadataMiddleware({ resource, authorizationServers })`** - Serves RFC 9728 metadata
- **`createOAuthHandlers`**, **`getWwwAuthenticateHeader`** - Re-exported from `@ttoss/auth-core` for convenience
