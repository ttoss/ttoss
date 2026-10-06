import { isExpectedError } from '@ttoss/errors';
import type { Catalog, I18n } from '@ttoss/i18n-core';
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

/**
 * Loaded on the first error, not at import: `@ttoss/i18n-core` pulls in the
 * ESM-only FormatJS runtime, which every app importing `@ttoss/http-server`
 * would otherwise load (and configure Jest for) whether it localizes or not.
 */
const renderLocalizedError = async (args: { error: unknown; i18n: I18n }) => {
  const i18nCore = await import('@ttoss/i18n-core');
  return i18nCore.renderLocalizedError(args);
};

const isClientError = (error: object) => {
  const status = readStatus(error);
  return (
    (status !== undefined && status >= 400 && status < 500) ||
    isExpectedError(error)
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
      const rendered = await renderLocalizedError({ error, i18n });

      if (!rendered) {
        throw error;
      }

      if (!isClientError(error as object)) {
        (error as Error).message = rendered.message;
        throw error;
      }

      ctx.status = readStatus(error as object) ?? 400;
      ctx.body = { error: rendered };
    }
  };
};
