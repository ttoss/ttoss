# @ttoss/http-server

Lightweight HTTP server built on [Koa](https://koajs.com/) for the ttoss ecosystem.

## Installation

```bash
pnpm add @ttoss/http-server
```

## Quick Start

```typescript
import { App, Router, bodyParser, cors } from '@ttoss/http-server';

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

## API Reference

All exports are re-exported from established Koa ecosystem packages:

- **`App`** - [Koa application](https://github.com/koajs/koa)
- **`Router`** - [Koa router](https://github.com/koajs/router) for routing
- **`bodyParser`** - [Koa body parser](https://github.com/koajs/bodyparser) for JSON/form parsing
- **`cors`** - [Koa CORS](https://github.com/koajs/cors) for cross-origin requests
- **`multer`** - [Koa multer](https://github.com/koajs/multer) for file uploads
- **`addHealthCheck({ app, path? })`** - Adds a health endpoint (defaults to `/health`) returning `{ status: 'ok' }`
- **`MulterFile`** (type) - File type for uploaded files
