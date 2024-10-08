# @ttoss/http-server

HTTP server for Node.js for ttoss ecosystem.

## Installation

```bash
pnpm add @ttoss/http-server
```

## Usage

```typescript
import { App, Router, bodyParser, cors } from '@ttoss/http-server';

const app = new App();

app.use(cors());

app.use(bodyParser());

const route = new Router();

route.get('/health', (ctx) => {
  ctx.body = 'OK';
});

app.use(route.routes());

app.use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## API

Some methods are re-exports from other libraries:

- `App` - [Koa application](https://github.com/koajs/koa)
- `Router` - [Koa router](https://github.com/koajs/router)
- `bodyParser` - [Koa body parser](https://github.com/koajs/bodyparser)
- `cors` - [Koa CORS](https://github.com/koajs/cors)
