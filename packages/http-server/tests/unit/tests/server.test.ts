import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  addHealthCheck,
  App,
  bodyParser,
  cors,
  multer,
  type MulterFile,
  Router,
  serve,
} from 'src/index';
import request from 'supertest';

const appWithCors = new App();

appWithCors.use(cors());

const route = new Router();

route.get('/health', (ctx) => {
  ctx.body = 'OK';
});

appWithCors.use(route.routes());

const appWithoutCors = new App();

appWithoutCors.use(route.routes());

appWithoutCors.use(route.allowedMethods());

test('GET /health with cors', async () => {
  appWithCors.use(cors());
  const response = await request(appWithCors.callback()).get('/health');
  expect(response.status).toBe(200);
  expect(response.text).toBe('OK');
  expect(response.headers['access-control-allow-origin']).toEqual('*');
});

test('GET /health without cors', async () => {
  const response = await request(appWithoutCors.callback()).get('/health');
  expect(response.status).toBe(200);
  expect(response.text).toBe('OK');
  expect(response.headers['access-control-allow-origin']).toBeUndefined();
});

test('POST /health without cors', async () => {
  const response = await request(appWithoutCors.callback()).post('/health');
  expect(response.status).toBe(405);
  expect(response.text).toBe('Method Not Allowed');
});

// bodyParser tests
describe('bodyParser middleware', () => {
  const appWithBodyParser = new App();
  const bodyRoute = new Router();

  bodyRoute.post('/json', (ctx) => {
    ctx.body = { received: ctx.request.body };
  });

  bodyRoute.post('/echo', (ctx) => {
    ctx.body = ctx.request.body;
  });

  appWithBodyParser.use(bodyParser());
  appWithBodyParser.use(bodyRoute.routes());

  test('should parse JSON request body', async () => {
    const testData = { name: 'test', value: 123 };
    const response = await request(appWithBodyParser.callback())
      .post('/json')
      .send(testData)
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.received).toEqual(testData);
  });

  test('should parse form-urlencoded data', async () => {
    const response = await request(appWithBodyParser.callback())
      .post('/echo')
      .send('name=test&value=123')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: 'test', value: '123' });
  });

  test('should handle malformed JSON', async () => {
    const response = await request(appWithBodyParser.callback())
      .post('/json')
      .send('{ invalid json }')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
  });

  test('should handle empty body', async () => {
    const response = await request(appWithBodyParser.callback())
      .post('/echo')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
  });
});

// multer file upload tests
describe('multer middleware', () => {
  const appWithMulter = new App();
  const upload = multer();
  const fileRoute = new Router();

  fileRoute.post('/upload/single', upload.single('file'), (ctx) => {
    const file = ctx.file as MulterFile | undefined;
    ctx.body = {
      filename: file?.originalname,
      size: file?.size,
      mimetype: file?.mimetype,
    };
  });

  fileRoute.post('/upload/multiple', upload.array('files', 3), (ctx) => {
    const files = ctx.files as MulterFile[] | undefined;
    ctx.body = {
      count: files?.length || 0,
      files:
        files?.map((f) => {
          return { name: f.originalname, size: f.size };
        }) || [],
    };
  });

  appWithMulter.use(fileRoute.routes());

  test('should handle single file upload', async () => {
    const response = await request(appWithMulter.callback())
      .post('/upload/single')
      .attach('file', Buffer.from('test content'), 'test.txt');

    expect(response.status).toBe(200);
    expect(response.body.filename).toBe('test.txt');
    expect(response.body.size).toBeGreaterThan(0);
  });

  test('should handle multiple file uploads', async () => {
    const response = await request(appWithMulter.callback())
      .post('/upload/multiple')
      .attach('files', Buffer.from('file 1'), 'file1.txt')
      .attach('files', Buffer.from('file 2'), 'file2.txt');

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.files).toHaveLength(2);
  });

  test('should handle no file upload', async () => {
    const response = await request(appWithMulter.callback()).post(
      '/upload/single'
    );

    expect(response.status).toBe(200);
    expect(response.body.filename).toBeUndefined();
  });
});

// Router features tests
describe('Router features', () => {
  const appWithRouter = new App();
  const featureRoute = new Router();

  featureRoute.get('/users/:id', (ctx) => {
    ctx.body = { userId: ctx.params.id };
  });

  featureRoute.get('/search', (ctx) => {
    ctx.body = { query: ctx.query };
  });

  featureRoute.put('/users/:id', (ctx) => {
    ctx.body = { method: 'PUT', userId: ctx.params.id };
  });

  featureRoute.delete('/users/:id', (ctx) => {
    ctx.body = { method: 'DELETE', userId: ctx.params.id };
  });

  featureRoute.patch('/users/:id', (ctx) => {
    ctx.body = { method: 'PATCH', userId: ctx.params.id };
  });

  appWithRouter.use(featureRoute.routes());

  test('should handle route parameters', async () => {
    const response = await request(appWithRouter.callback()).get('/users/123');

    expect(response.status).toBe(200);
    expect(response.body.userId).toBe('123');
  });

  test('should handle query parameters', async () => {
    const response = await request(appWithRouter.callback()).get(
      '/search?q=test&limit=10'
    );

    expect(response.status).toBe(200);
    expect(response.body.query).toEqual({ q: 'test', limit: '10' });
  });

  test('should handle PUT requests', async () => {
    const response = await request(appWithRouter.callback()).put('/users/456');

    expect(response.status).toBe(200);
    expect(response.body.method).toBe('PUT');
    expect(response.body.userId).toBe('456');
  });

  test('should handle DELETE requests', async () => {
    const response = await request(appWithRouter.callback()).delete(
      '/users/789'
    );

    expect(response.status).toBe(200);
    expect(response.body.method).toBe('DELETE');
  });

  test('should handle PATCH requests', async () => {
    const response = await request(appWithRouter.callback()).patch(
      '/users/999'
    );

    expect(response.status).toBe(200);
    expect(response.body.method).toBe('PATCH');
  });
});

// Error handling tests
describe('Error handling', () => {
  const appWithErrorHandling = new App();
  const errorRoute = new Router();

  // Custom error middleware
  appWithErrorHandling.use(async (ctx, next) => {
    try {
      await next();
    } catch (error: unknown) {
      const err = error as { status?: number; message: string };
      ctx.status = err.status || 500;
      ctx.body = { error: err.message };
    }
  });

  errorRoute.get('/error', (_ctx) => {
    throw new Error('Test error');
  });

  errorRoute.get('/status-error', (_ctx) => {
    const error = new Error('Custom error') as Error & { status: number };
    error.status = 422;
    throw error;
  });

  appWithErrorHandling.use(errorRoute.routes());

  test('should return 404 for non-existent routes', async () => {
    const response = await request(appWithErrorHandling.callback()).get(
      '/does-not-exist'
    );

    expect(response.status).toBe(404);
  });

  test('should handle thrown errors with custom middleware', async () => {
    const response = await request(appWithErrorHandling.callback()).get(
      '/error'
    );

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Test error');
  });

  test('should respect custom error status codes', async () => {
    const response = await request(appWithErrorHandling.callback()).get(
      '/status-error'
    );

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Custom error');
  });
});

// allowedMethods edge cases
describe('allowedMethods edge cases', () => {
  const appWithAllowedMethods = new App();
  const methodRoute = new Router();

  methodRoute.get('/resource', (ctx) => {
    ctx.body = 'GET response';
  });

  methodRoute.post('/resource', (ctx) => {
    ctx.body = 'POST response';
  });

  appWithAllowedMethods.use(methodRoute.routes());
  appWithAllowedMethods.use(methodRoute.allowedMethods());

  test('should handle OPTIONS requests', async () => {
    const response = await request(appWithAllowedMethods.callback()).options(
      '/resource'
    );

    expect(response.status).toBe(200);
    expect(response.headers.allow).toBeDefined();
    expect(response.headers.allow).toContain('GET');
    expect(response.headers.allow).toContain('POST');
  });

  test('should return 405 for disallowed methods', async () => {
    const response = await request(appWithAllowedMethods.callback()).delete(
      '/resource'
    );

    expect(response.status).toBe(405);
  });

  test('should return 501 for not implemented methods', async () => {
    const agent = request(appWithAllowedMethods.callback()) as {
      trace: (path: string) => Promise<request.Response>;
    };
    const response = await agent.trace('/resource');

    expect(response.status).toBe(501);
  });
});

// addHealthCheck tests
describe('addHealthCheck', () => {
  test('GET /health should return status ok with default path', async () => {
    const app = new App();
    addHealthCheck({ app });

    const response = await request(app.callback()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('POST /health should return 405', async () => {
    const app = new App();
    addHealthCheck({ app });

    const response = await request(app.callback()).post('/health');

    expect(response.status).toBe(405);
  });

  test('should use custom path when provided', async () => {
    const app = new App();
    addHealthCheck({ app, path: '/healthz' });

    const response = await request(app.callback()).get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('default path should not exist when custom path is used', async () => {
    const app = new App();
    addHealthCheck({ app, path: '/status' });

    const response = await request(app.callback()).get('/health');

    expect(response.status).toBe(404);
  });
});

// serve static files tests
describe('serve middleware', () => {
  let tempDir: string;
  let testFilePath: string;
  let nestedFilePath: string;

  beforeAll(() => {
    // Create temporary directory and test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'http-server-test-'));
    testFilePath = path.join(tempDir, 'test.txt');
    fs.writeFileSync(testFilePath, 'Hello from static file');

    const nestedDir = path.join(tempDir, 'nested');
    fs.mkdirSync(nestedDir);
    nestedFilePath = path.join(nestedDir, 'nested.html');
    fs.writeFileSync(nestedFilePath, '<html><body>Nested</body></html>');
  });

  afterAll(() => {
    // Clean up temporary files
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('should serve static files from directory', async () => {
    const app = new App();
    app.use(serve(tempDir));

    const response = await request(app.callback()).get('/test.txt');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello from static file');
  });

  test('should serve nested static files', async () => {
    const app = new App();
    app.use(serve(tempDir));

    const response = await request(app.callback()).get('/nested/nested.html');

    expect(response.status).toBe(200);
    expect(response.text).toBe('<html><body>Nested</body></html>');
    expect(response.headers['content-type']).toContain('text/html');
  });

  test('should return 404 for non-existent files', async () => {
    const app = new App();
    app.use(serve(tempDir));

    const response = await request(app.callback()).get('/does-not-exist.txt');

    expect(response.status).toBe(404);
  });

  test('should work with other middleware', async () => {
    const app = new App();
    const router = new Router();

    // Add dynamic route
    router.get('/api/data', (ctx) => {
      ctx.body = { message: 'API response' };
    });

    app.use(router.routes());
    app.use(serve(tempDir));

    // Test dynamic route
    const apiResponse = await request(app.callback()).get('/api/data');
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.body).toEqual({ message: 'API response' });

    // Test static file
    const staticResponse = await request(app.callback()).get('/test.txt');
    expect(staticResponse.status).toBe(200);
    expect(staticResponse.text).toBe('Hello from static file');
  });

  test('should respect maxage option', async () => {
    const app = new App();
    app.use(serve(tempDir, { maxage: 3600000 })); // 1 hour in ms

    const response = await request(app.callback()).get('/test.txt');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toContain('max-age=3600');
  });

  test('should handle index files when accessing directory', async () => {
    const app = new App();
    const indexDir = path.join(tempDir, 'with-index');
    fs.mkdirSync(indexDir);
    fs.writeFileSync(path.join(indexDir, 'index.html'), '<html>Index</html>');

    app.use(serve(tempDir));

    const response = await request(app.callback()).get('/with-index/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('<html>Index</html>');
  });

  test('should handle HEAD requests', async () => {
    const app = new App();
    app.use(serve(tempDir));

    const response = await request(app.callback()).head('/test.txt');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
  });

  test('should prevent directory traversal attacks', async () => {
    const app = new App();
    app.use(serve(tempDir));

    const response = await request(app.callback()).get('/../../../etc/passwd');

    // koa-static returns 404 for malformed paths, not 403
    expect(response.status).toBe(404);
  });
});
