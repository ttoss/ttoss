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

/**
 * An error carrying a stable `code` but no `messageRef` — what a package that
 * holds no copy throws, with the data its message needs in `values`.
 */
export type CodedError = Error & {
  code: string;
  values?: Record<string, unknown>;
};

const isCodedError = (error: unknown): error is CodedError => {
  return (
    error instanceof Error &&
    typeof (error as { code?: unknown }).code === 'string' &&
    (error as { messageRef?: unknown }).messageRef === undefined
  );
};

type ResolveMessageRef<TContext> = (args: {
  error: CodedError;
  context: TContext;
  info: AppSyncInfo;
}) => MessageRef | undefined | Promise<MessageRef | undefined>;

/**
 * The error as a localized one, attaching the resolved reference when it has
 * none; `undefined` when it stays as it is.
 */
const asLocalizedError = async <TContext>({
  error,
  context,
  info,
  resolveMessageRef,
}: {
  error: unknown;
  context: TContext;
  info: AppSyncInfo;
  resolveMessageRef?: ResolveMessageRef<TContext>;
}): Promise<LocalizedErrorShape | undefined> => {
  if (await isLocalizedError(error)) {
    return error as LocalizedErrorShape;
  }

  if (!resolveMessageRef || !isCodedError(error)) {
    return undefined;
  }

  try {
    const messageRef = await resolveMessageRef({ error, context, info });
    const i18nCore = await import('@ttoss/i18n-core');

    if (!i18nCore.isMessageRef(messageRef)) {
      return undefined;
    }

    const localized = error as CodedError & { messageRef?: MessageRef };
    localized.messageRef = messageRef;

    return localized as LocalizedErrorShape;
  } catch {
    // Resolving is best effort, like rendering: the error is still the answer.
    return undefined;
  }
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
 * is the bare code; see the example to keep the class visible, or pass
 * `({ name }) => name` to leave `errorType` as it was.
 * The error object itself is kept, so markers such as an `expected` flag
 * still reach whatever reports it. Any other error passes through untouched.
 *
 * Put it first in `middlewares`, so it also sees errors thrown by the
 * middlewares after it (authorization gates).
 *
 * If the catalog cannot be loaded, the error is rethrown unrendered. The
 * client then sees the source-language message rather than losing the error.
 *
 * `resolveMessageRef` covers an error that has a `code` but no `messageRef`,
 * thrown by code that holds no copy: it maps the code (and the error's
 * `values`) to a reference, which is attached and rendered like any other.
 * Returning `undefined` leaves the error as it was, so an unmapped code keeps
 * its own message. A reference already attached is never replaced.
 *
 * @example
 * ```ts
 * createAppSyncI18nMiddleware({
 *   catalog,
 *   errorType: ({ name, code }) => `${name}[${code}]`,
 * });
 * ```
 */
export const createAppSyncI18nMiddleware = <TContext = unknown>({
  catalog,
  getLocale,
  errorType = ({ code }) => {
    return code;
  },
  resolveMessageRef,
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
  /**
   * The reference for an error with a `code` and no `messageRef`, or
   * `undefined` to leave it unrendered.
   */
  resolveMessageRef?: ResolveMessageRef<TContext>;
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

        if (result instanceof Error) {
          const localized = await asLocalizedError({
            error: result,
            context,
            info,
            resolveMessageRef,
          });

          if (localized) {
            return localize({ error: localized, context, info });
          }
        }

        return result;
      } catch (error) {
        const localized = await asLocalizedError({
          error,
          context,
          info,
          resolveMessageRef,
        });

        if (localized) {
          throw await localize({ error: localized, context, info });
        }

        throw error;
      }
    }
  );
};
