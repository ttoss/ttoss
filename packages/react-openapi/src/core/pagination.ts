import { hasQueryParameter } from './operations';
import type { JsonObject, ResolvedOperation } from './types';

const isJsonObject = (value: unknown): value is JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// ─── Page data ───────────────────────────────────────────────────────────────

const TOTAL_KEYS = ['total', 'total_count', 'totalCount', 'count'];

/**
 * The total number of records reported by a paginated wrapper, if any.
 */
export const extractTotal = (data: unknown): number | undefined => {
  if (!isJsonObject(data)) {
    return undefined;
  }
  for (const key of TOTAL_KEYS) {
    const value = data[key];
    if (typeof value === 'number') {
      return value;
    }
  }
  const meta = data.meta ?? data.pagination;
  return isJsonObject(meta) ? extractTotal(meta) : undefined;
};

const NEXT_CURSOR_KEYS = [
  'next_cursor',
  'nextCursor',
  'next_page_token',
  'nextPageToken',
];

/**
 * The cursor of the next page reported by a cursor-paginated wrapper
 * (`{ data: [...], next_cursor }`), or undefined on the last page.
 */
export const extractNextCursor = (data: unknown): string | undefined => {
  if (!isJsonObject(data)) {
    return undefined;
  }
  for (const key of NEXT_CURSOR_KEYS) {
    const value = data[key];
    if (typeof value === 'string' && value) {
      return value;
    }
  }
  const meta = data.meta ?? data.pagination;
  return isJsonObject(meta) ? extractNextCursor(meta) : undefined;
};

// ─── Pagination ──────────────────────────────────────────────────────────────

export type ServerPagination =
  | { type: 'offset'; limitParam: string; offsetParam: string }
  | {
      type: 'page';
      pageParam: string;
      sizeParam: string;
      /** Index of the first page (0 or 1). */
      firstPage: number;
    }
  | { type: 'cursor'; limitParam: string; cursorParam: string };

const firstMatch = ({
  operation,
  names,
}: {
  operation: ResolvedOperation;
  names: string[];
}): string | undefined => {
  return names.find((name) => {
    return hasQueryParameter({ operation, name });
  });
};

const LIMIT_NAMES = ['limit', 'page_size', 'pageSize', 'per_page', 'perPage'];
const OFFSET_NAMES = ['offset', 'skip'];
const CURSOR_NAMES = [
  'cursor',
  'page_token',
  'pageToken',
  'after',
  'starting_after',
];

/** Index of the first page: 0 when the `page` param's minimum says so. */
const firstPageOf = ({
  operation,
  pageParam,
}: {
  operation: ResolvedOperation;
  pageParam: string;
}): number => {
  const pageSchema = operation.operation.parameters?.find((param) => {
    return param.name === pageParam;
  })?.schema;
  return pageSchema?.minimum === 0 ? 0 : 1;
};

/**
 * Detects server-side pagination from the operation's declared query
 * parameters: a size param (`limit`…) with `offset`, a `cursor` (the response
 * then names the next page) or `page`. Returns undefined when the operation
 * has none, in which case the table paginates client-side.
 */
export const detectServerPagination = (
  operation: ResolvedOperation
): ServerPagination | undefined => {
  const find = (names: string[]) => {
    return firstMatch({ operation, names });
  };
  const limitParam = find(LIMIT_NAMES);
  if (!limitParam) {
    return undefined;
  }
  const offsetParam = find(OFFSET_NAMES);
  if (offsetParam) {
    return { type: 'offset', limitParam, offsetParam };
  }
  const cursorParam = find(CURSOR_NAMES);
  if (cursorParam) {
    return { type: 'cursor', limitParam, cursorParam };
  }
  const pageParam = find(['page']);
  return pageParam
    ? {
        type: 'page',
        pageParam,
        sizeParam: limitParam,
        firstPage: firstPageOf({ operation, pageParam }),
      }
    : undefined;
};

/**
 * The query params that request one page from the server. A cursor-paginated
 * page needs the `cursor` the previous page returned (none for the first).
 */
export const paginationParams = ({
  pagination,
  pageIndex,
  pageSize,
  cursor,
}: {
  pagination: ServerPagination;
  pageIndex: number;
  pageSize: number;
  cursor?: string;
}): Record<string, number | string> => {
  if (pagination.type === 'cursor') {
    return cursor
      ? { [pagination.limitParam]: pageSize, [pagination.cursorParam]: cursor }
      : { [pagination.limitParam]: pageSize };
  }
  if (pagination.type === 'offset') {
    return {
      [pagination.limitParam]: pageSize,
      [pagination.offsetParam]: pageIndex * pageSize,
    };
  }
  return {
    [pagination.sizeParam]: pageSize,
    [pagination.pageParam]: pageIndex + pagination.firstPage,
  };
};
