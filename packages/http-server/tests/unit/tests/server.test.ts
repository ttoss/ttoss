import { App, Router, cors } from 'src/index';
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
