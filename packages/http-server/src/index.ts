import { bodyParser } from '@koa/bodyparser';
import cors from '@koa/cors';
import multer from '@koa/multer';
import Router from '@koa/router';
import App from 'koa';

export interface AddHealthCheckOptions {
  /**
   * The Koa application instance to attach the health check to.
   */
  app: App;
  /**
   * The path for the health endpoint.
   * @default '/health'
   */
  path?: string;
}

/**
 * Adds a health check endpoint to the Koa application.
 *
 * @example
 * ```typescript
 * import { App, addHealthCheck } from '@ttoss/http-server';
 *
 * const app = new App();
 * addHealthCheck({ app });
 *
 * app.listen(3000);
 * // GET /health returns { status: 'ok' }
 * ```
 *
 * @example
 * ```typescript
 * // Custom path
 * addHealthCheck({ app, path: '/healthz' });
 * ```
 */
export const addHealthCheck = ({
  app,
  path = '/health',
}: AddHealthCheckOptions): void => {
  const router = new Router();

  router.get(path, (ctx) => {
    ctx.body = { status: 'ok' };
  });

  app.use(router.routes());
  app.use(router.allowedMethods());
};

export { App, bodyParser, cors, multer, Router };

export type { File as MulterFile } from '@koa/multer';
