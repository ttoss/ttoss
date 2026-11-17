import {
  extractNextCursor,
  extractTotal,
  type ServerPagination,
} from '../core/table';

const pageInfo = ({
  total,
  pageIndex,
  pageSize,
  loadedCount,
  nextCursor,
}: {
  total?: number;
  pageIndex: number;
  pageSize: number;
  loadedCount: number;
  /** Set for cursor pagination: the response's next cursor, if any. */
  nextCursor?: string | null;
}) => {
  if (nextCursor !== undefined) {
    return { pageCount: undefined, hasNextPage: !!nextCursor };
  }
  if (total === undefined) {
    return { pageCount: undefined, hasNextPage: loadedCount === pageSize };
  }
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return { pageCount, hasNextPage: pageIndex + 1 < pageCount };
};

/**
 * What the pagination bar shows and does. The total comes from the response
 * when the server paginates; a cursor list instead knows only whether a next
 * page exists, and moving forward records the cursor that requests it.
 */
export const paginationState = ({
  server,
  data,
  fetching,
  pageIndex,
  pageSize,
  filteredCount,
  loadedCount,
  rowCount,
  goToPage,
}: {
  server?: ServerPagination;
  data: unknown;
  fetching: boolean;
  pageIndex: number;
  pageSize: number;
  filteredCount: number;
  loadedCount: number;
  rowCount: number;
  goToPage: (args: { index: number; cursor?: string }) => void;
}) => {
  const total = server ? extractTotal(data) : filteredCount;
  // While the next page loads, the previous page's cursor is stale.
  const nextCursor =
    server?.type === 'cursor'
      ? fetching
        ? null
        : (extractNextCursor(data) ?? null)
      : undefined;
  return {
    pageIndex,
    pageSize,
    total,
    rowCount,
    onPageChange: (index: number) => {
      goToPage({
        index,
        cursor: index === pageIndex + 1 ? (nextCursor ?? undefined) : undefined,
      });
    },
    ...pageInfo({ total, pageIndex, pageSize, loadedCount, nextCursor }),
  };
};
