import type { Context, Next } from '@ttoss/http-server';

import { authMiddleware } from './authMiddleware';
import type { AuthMiddlewareOptions } from './types';

/**
 * Route-level authentication middleware. Same options as `authMiddleware`,
 * `required` defaults to true.
 *
 * @example
 * router.get('/me', requireAuth({ strategies: ['jwt', 'apiToken'] }), handler);
 */
export const requireAuth = (
  options: AuthMiddlewareOptions
): ((ctx: Context, next: Next) => Promise<void>) => {
  return authMiddleware({ required: true, ...options });
};
