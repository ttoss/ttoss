import {
  type Catalog,
  type I18n,
  isLocalizedError,
  renderLocalizedError,
} from '@ttoss/i18n-core';
import type { Context, Middleware } from 'koa';

type Requested = string | string[] | null | undefined;

/** What {@link i18nMiddleware} puts on `ctx.state`. */
export type I18nState = {
  /** The negotiated locale. */
  locale: string;
  /** Renders message references in {@link I18nState.locale}. */
  i18n: I18n;
};

const readStatus = (error: object): number | undefined => {
  const { status, statusCode } = error as {
    status?: unknown;
    statusCode?: unknown;
  };
  const raw = status ?? statusCode;
  return typeof raw === 'number' ? raw : undefined;
};

const isClientError = (error: object) => {
  const status = readStatus(error);
  return (
    (status !== undefined && status >= 400 && status < 500) ||
    (error as { expected?: unknown }).expected === true
  );
};

/**
 * Negotiates the request locale and renders `LocalizedError`s at the HTTP
 * boundary.
 *
 * - Sets `ctx.state.locale` and `ctx.state.i18n` for handlers that render
 *   message references themselves. The locale comes from `getUserLocale` (a
 *   stored preference) first, then `Accept-Language`, then the catalog's
 *   fallback.
 * - A thrown `LocalizedError` that is client-facing (a 4xx `status`, or the
 *   `expected` marker) becomes `{ error: { code, message } }` with that status
 *   (400 by default).
 * - Any other `LocalizedError` has its `message` rendered in place and is
 *   rethrown, so the app's own error handling (and reporting) still sees it.
 *   Every non-localized error is rethrown untouched.
 *
 * Mount it before the routes and after any catch-all error middleware.
 */
export const i18nMiddleware = ({
  catalog,
  getUserLocale,
}: {
  catalog: Pick<Catalog, 'getI18n'>;
  getUserLocale?: (ctx: Context) => Requested | Promise<Requested>;
}): Middleware => {
  const requestedLocales = async (ctx: Context) => {
    const userLocale = getUserLocale ? await getUserLocale(ctx) : undefined;
    const acceptLanguage = ctx.get('Accept-Language') || undefined;
    return [userLocale, acceptLanguage].flat().filter((locale) => {
      return typeof locale === 'string' && locale !== '';
    }) as string[];
  };

  return async (ctx, next) => {
    const i18n = await catalog.getI18n(await requestedLocales(ctx));
    Object.assign(ctx.state, { locale: i18n.locale, i18n });

    try {
      await next();
    } catch (error) {
      const rendered = renderLocalizedError({ error, i18n });

      if (!rendered || !isLocalizedError(error)) {
        throw error;
      }

      if (!isClientError(error)) {
        error.message = rendered.message;
        throw error;
      }

      ctx.status = readStatus(error) ?? 400;
      ctx.body = { error: rendered };
    }
  };
};
