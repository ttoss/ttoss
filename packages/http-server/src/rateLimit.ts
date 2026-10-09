import type { Context, Middleware } from 'koa';

/** What one {@link RateLimiter.consume} call answers. */
export interface RateLimitResult {
  /** Whether this request is inside the limit. It was counted only if so. */
  allowed: boolean;
  /** Requests left in the current window after this one. */
  remaining: number;
  /** When the current window ends, in epoch milliseconds. */
  resetAt: number;
}

export interface RateLimiter {
  /** Counts one request against `key`, unless the window is already full. */
  consume: (args: { key: string; limit: number }) => RateLimitResult;
}

/**
 * A fixed-window counter per key, held in this process's memory.
 *
 * In this process and no further: with N instances the effective limit is N
 * times the configured one. That is the right trade for stopping a runaway
 * client; a shared counter would put a store in the path of every request.
 * A fixed window allows a burst of twice the limit at a boundary, for the
 * same reason.
 *
 * Expired keys are swept at most once a window, inside `consume`, so a key
 * per IP does not grow memory without bound and no timer holds the process
 * open.
 */
export const createRateLimiter = ({
  windowMs,
  now = Date.now,
}: {
  windowMs: number;
  /** Clock, for tests. */
  now?: () => number;
}): RateLimiter => {
  const windows = new Map<string, { resetAt: number; count: number }>();
  let nextSweepAt = now() + windowMs;

  const sweep = (at: number) => {
    if (at < nextSweepAt) {
      return;
    }

    for (const [key, window] of windows) {
      if (window.resetAt <= at) {
        windows.delete(key);
      }
    }

    nextSweepAt = at + windowMs;
  };

  return {
    consume: ({ key, limit }) => {
      const at = now();

      sweep(at);

      let window = windows.get(key);

      if (!window || window.resetAt <= at) {
        window = { resetAt: at + windowMs, count: 0 };
        windows.set(key, window);
      }

      if (window.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: window.resetAt };
      }

      window.count += 1;

      return {
        allowed: true,
        remaining: limit - window.count,
        resetAt: window.resetAt,
      };
    },
  };
};

/**
 * Koa middleware over {@link createRateLimiter}: a request over the limit is
 * answered `429` through `ctx.throw`, carrying `Retry-After`, so an error
 * middleware using `toHttpError` and `applyHttpErrorHeaders` keeps both.
 *
 * Every response carries `RateLimit-Limit`, `RateLimit-Remaining` and
 * `RateLimit-Reset` (seconds until the window ends). A `key` returning
 * `undefined` skips the limit for that request.
 *
 * When the key or the limit is only known inside the handler, use
 * `createRateLimiter` directly.
 */
export const rateLimit = ({
  windowMs,
  limit,
  key,
  message = 'Too many requests.',
  now,
}: {
  windowMs: number;
  limit: number | ((ctx: Context) => number);
  key: (ctx: Context) => string | undefined;
  message?: string;
  /** Clock, for tests. */
  now?: () => number;
}): Middleware => {
  const limiter = createRateLimiter({ windowMs, now });
  const clock = now ?? Date.now;

  return async (ctx, next) => {
    const id = key(ctx);

    if (id === undefined) {
      return next();
    }

    const max = typeof limit === 'function' ? limit(ctx) : limit;
    const result = limiter.consume({ key: id, limit: max });
    const resetSeconds = Math.max(
      0,
      Math.ceil((result.resetAt - clock()) / 1000)
    );

    const headers = {
      'RateLimit-Limit': String(max),
      'RateLimit-Remaining': String(result.remaining),
      'RateLimit-Reset': String(resetSeconds),
    };

    // Koa clears the response's headers when it answers an error, so a 429
    // carries its own on the error rather than relying on `ctx.set`.
    if (!result.allowed) {
      ctx.throw(429, message, {
        headers: { ...headers, 'Retry-After': String(resetSeconds) },
      });
    }

    ctx.set(headers);

    return next();
  };
};
