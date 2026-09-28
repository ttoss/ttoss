import type { Catalog, MessageRef } from '@ttoss/i18n-core';

import { type AppSyncInfo, createAppSyncMiddleware } from './appSyncMiddleware';

type LocalizedErrorShape = Error & { code: string; messageRef: MessageRef };

/**
 * Loaded on the first error, not at import: `@ttoss/i18n-core` pulls in the
 * ESM-only FormatJS runtime, which an app that never uses this middleware
 * should not have to load (or configure Jest for).
 */
const isLocalizedError = async (error: unknown): Promise<boolean> => {
  const i18nCore = await import('@ttoss/i18n-core');
  return i18nCore.isLocalizedError(error);
};

type Requested = string | string[] | null | undefined;

/**
 * The `Accept-Language` header of the AppSync request, which the client sends
 * like any other header. Header names are matched case-insensitively.
 */
export const getRequestLocale = (context: {
  request?: { headers?: Record<string, unknown> } | null;
}): string | undefined => {
  const headers = context.request?.headers ?? {};

  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === 'accept-language' && typeof value === 'string') {
      return value;
    }
  }

  return undefined;
};

export type ErrorTypeArgs = {
  /** The error's stable code. */
  code: string;
  /** The error's `name` before rendering — its class, usually. */
  name: string;
};

/**
 * Renders a thrown or returned `LocalizedError` in the request locale before
 * it leaves the Lambda.
 *
 * Only `error.name` (AppSync's `errorType`) and `error.message` survive the
 * Direct Lambda boundary, so the error is rewritten in place: `message`
 * becomes the rendered text and `name` becomes `errorType(...)`. The default
 * is the bare code. Pass `({ name, code }) => \`${name}[${code}]\`` to keep
 * the class visible, or `({ name }) => name` to leave `errorType` as it was.
 * The error object itself is kept, so markers such as an `expected` flag
 * still reach whatever reports it. Any other error passes through untouched.
 *
 * Put it first in `middlewares`, so it also sees errors thrown by the
 * middlewares after it (authorization gates).
 *
 * If the catalog cannot be loaded, the error is rethrown unrendered. The
 * client then sees the source-language message rather than losing the error.
 */
export const createAppSyncI18nMiddleware = <TContext = unknown>({
  catalog,
  getLocale,
  errorType = ({ code }) => {
    return code;
  },
}: {
  catalog: Pick<Catalog, 'getI18n'>;
  /**
   * The requested locale — a stored user preference, or a list tried in
   * order. Defaults to the request's `Accept-Language`.
   */
  getLocale?: (args: {
    context: TContext;
    info: AppSyncInfo;
  }) => Requested | Promise<Requested>;
  errorType?: (args: ErrorTypeArgs) => string;
}) => {
  const localize = async ({
    error,
    context,
    info,
  }: {
    error: LocalizedErrorShape;
    context: TContext;
    info: AppSyncInfo;
  }) => {
    try {
      const requested = getLocale
        ? await getLocale({ context, info })
        : getRequestLocale(context as Parameters<typeof getRequestLocale>[0]);
      const i18n = await catalog.getI18n(requested);
      const name = error.name;
      error.message = i18n.render(error.messageRef);
      error.name = errorType({ code: error.code, name });
    } catch {
      // Rendering is best effort: the original error is still the answer.
    }

    return error;
  };

  return createAppSyncMiddleware<unknown, TContext, unknown>(
    async (resolve, source, args, context, info) => {
      try {
        const result = await resolve(source, args, context, info);

        if (result instanceof Error && (await isLocalizedError(result))) {
          return localize({
            error: result as LocalizedErrorShape,
            context,
            info,
          });
        }

        return result;
      } catch (error) {
        if (await isLocalizedError(error)) {
          throw await localize({
            error: error as LocalizedErrorShape,
            context,
            info,
          });
        }

        throw error;
      }
    }
  );
};
