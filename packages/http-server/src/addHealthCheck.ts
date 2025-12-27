import Router from '@koa/router';
import type App from 'koa';

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
 * addHealthCheck({ app, path: '/health' });
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
