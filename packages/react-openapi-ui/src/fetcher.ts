import type { HttpMethod } from './core/types';

export type FetcherRequest = {
  method: HttpMethod;
  /** Path plus query string, as built from the spec (e.g. `/api/v1/clients?limit=10`). */
  url: string;
  /** A JSON-serializable value, or `FormData` for multipart operations. */
  body?: unknown;
  signal?: AbortSignal;
};

/**
 * Performs one HTTP request and resolves with the parsed response body. It
 * must reject when the request fails, so the UI can show the error. This is
 * where the app adds its base URL, auth headers, retries or SDK client.
 */
export type Fetcher = (request: FetcherRequest) => Promise<unknown>;

export class OpenApiRequestError extends Error {
  status: number;

  body: unknown;

  constructor({
    status,
    body,
    message,
  }: {
    status: number;
    body: unknown;
    message: string;
  }) {
    super(message);
    this.name = 'OpenApiRequestError';
    this.status = status;
    this.body = body;
  }
}

const errorMessage = ({
  status,
  body,
}: {
  status: number;
  body: unknown;
}): string => {
  if (typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>;
    const candidate = record.message ?? record.error ?? record.detail;
    if (typeof candidate === 'string') {
      return candidate;
    }
  }
  return `Request failed with status ${status}`;
};

/**
 * The fetch `body` and content headers for a request body: FormData as is (the
 * browser sets the multipart boundary itself), anything else as JSON.
 */
const encodeBody = (
  body: unknown
): { body?: BodyInit; headers: Record<string, string> } => {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body === undefined) {
    return { headers };
  }
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return { body, headers };
  }
  return {
    body: JSON.stringify(body),
    headers: { ...headers, 'Content-Type': 'application/json' },
  };
};

/** JSON when the body parses as JSON, the raw text otherwise. */
const parseBody = (text: string): unknown => {
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/**
 * A `Fetcher` over the global `fetch`, for APIs that only need a base URL and
 * static or per-request headers (e.g. a bearer token).
 */
export const createFetcher = ({
  baseUrl = '',
  headers,
}: {
  baseUrl?: string;
  headers?:
    | Record<string, string>
    | (() => Record<string, string> | Promise<Record<string, string>>);
} = {}): Fetcher => {
  return async ({ method, url, body, signal }) => {
    const resolvedHeaders =
      typeof headers === 'function' ? await headers() : headers;
    const encoded = encodeBody(body);
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}${url}`, {
      method: method.toUpperCase(),
      headers: { ...encoded.headers, ...resolvedHeaders },
      body: encoded.body,
      signal,
    });
    const parsed = parseBody(await response.text());
    if (!response.ok) {
      throw new OpenApiRequestError({
        status: response.status,
        body: parsed,
        message: errorMessage({ status: response.status, body: parsed }),
      });
    }
    return parsed;
  };
};
