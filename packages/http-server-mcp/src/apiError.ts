import type { CallToolResult } from '@modelcontextprotocol/server';

// A registry symbol, not `instanceof`: two copies of this package in one
// install (e.g. a consumer and `@ttoss/http-server-mcp-openapi` resolving
// different versions) must still recognise each other's errors.
const API_ERROR = Symbol.for('@ttoss/http-server-mcp/ApiError');

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const readText = (value: unknown): string | undefined => {
  return typeof value === 'string' && value !== '' ? value : undefined;
};

/**
 * The message an error body carries, across the two shapes REST APIs answer
 * with: `{ error: 'text' }` and `{ error: { code?, message? } }`.
 *
 * The structured one is why this is read rather than taken: an object handed
 * to `new Error()` renders as `[object Object]`, and inside a tool handler
 * that string is the whole answer the calling model acts on.
 *
 * Exported so a tool handler with its own HTTP client renders error bodies
 * exactly as `apiCall` does. Returns `undefined` when the body carries no
 * message.
 *
 * @example
 * ```typescript
 * if (!response.ok) {
 *   const body = await response.json().catch(() => undefined);
 *   throw new Error(errorBodyMessage(body) ?? `HTTP ${response.status}`);
 * }
 * ```
 */
export const errorBodyMessage = (body: unknown): string | undefined => {
  if (!isRecord(body)) {
    return undefined;
  }

  const { error } = body;

  if (!isRecord(error)) {
    return readText(error);
  }

  const code = readText(error.code);
  const message = readText(error.message);

  if (message === undefined) {
    return code;
  }

  return code === undefined ? message : `${code}: ${message}`;
};

/** Parameters for {@link ApiError}. */
export interface ApiErrorParams {
  /** The one-line text the tool result carries for the model. */
  message: string;
  /** The HTTP status the REST API answered. */
  status: number;
  /** The parsed response body, `undefined` when it was not JSON. */
  body?: unknown;
}

/**
 * A non-2xx REST answer, thrown by `apiCall` and by the `callApi` of
 * `@ttoss/http-server-mcp-openapi`. A tool registered with `registerTools`
 * that lets it escape answers {@link apiErrorResult}: the text line plus the
 * envelope as `structuredContent`, so a client reads the error `code` without
 * parsing a string.
 */
export class ApiError extends Error {
  /** The HTTP status the REST API answered. */
  readonly status: number;
  /** The parsed response body, `undefined` when it was not JSON. */
  readonly body: unknown;
  readonly [API_ERROR] = true;

  constructor({ message, status, body }: ApiErrorParams) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** Whether `error` is an {@link ApiError}, from any copy of this package. */
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { [API_ERROR]?: unknown })[API_ERROR] === true
  );
};

/**
 * The tool result for a failed REST answer: `isError: true`, the error's
 * message as text, and `structuredContent: { status, error }`, where `error`
 * is the body's `error` object unchanged (`code`, `message`, `meta`, `hint`,
 * `docs_url`, …). A body with no `error` object carries `status` alone.
 *
 * `registerTools` applies it to an `ApiError` a tool throws; call it yourself
 * in a handler registered with `server.registerTool` directly.
 *
 * @example
 * ```typescript
 * try {
 *   return jsonResult(await apiCall('POST', '/tasks', { body }));
 * } catch (error) {
 *   if (isApiError(error)) return apiErrorResult(error);
 *   throw error;
 * }
 * ```
 */
export const apiErrorResult = (
  error: ApiError
): CallToolResult & { isError: true } => {
  const envelope =
    isRecord(error.body) && isRecord(error.body.error)
      ? error.body.error
      : undefined;
  return {
    content: [{ type: 'text', text: error.message }],
    isError: true,
    structuredContent: {
      status: error.status,
      ...(envelope === undefined ? {} : { error: envelope }),
    },
  };
};
