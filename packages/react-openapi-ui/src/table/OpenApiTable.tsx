import { useI18n } from '@ttoss/react-i18n';
import type * as React from 'react';

import type { JsonObject, OperationParams } from '../core/types';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';
import { SortIcon } from '../ui/icons';
import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';
import { CellValue } from './CellValue';
import { messages } from './messages';
import { TablePagination } from './TablePagination';
import { TableToolbar } from './TableToolbar';
import {
  type OpenApiTableColumn,
  type ResolvedColumn,
  type SortState,
  type TablePaginationMode,
  useTableModel,
} from './useTableModel';

export type OpenApiTableProps = {
  /** `operationId` of the list operation (a GET returning an array or a paginated wrapper). */
  operationId: string;
  /**
   * Path and query params for the request, as one flat object. Each lands
   * where the spec declares it; params the operation does not declare are
   * ignored.
   */
  params?: OperationParams;
  /**
   * Columns to show, in order. A string keeps the default header and
   * formatting. Omit to derive the columns from the response schema.
   */
  columns?: (string | OpenApiTableColumn)[];
  /** Cap on derived columns when `columns` is omitted. Defaults to 6. */
  maxColumns?: number;
  /** Rows per page. Defaults to 10. */
  pageSize?: number;
  /**
   * `auto` (default) paginates on the server when the operation declares
   * `limit`/`offset` or `page`/size query params, and in the browser
   * otherwise. `client` always pages in the browser; `none` shows every row.
   */
  pagination?: TablePaginationMode;
  /**
   * Shows a search input. It sends a `q`/`search`/`query` param when the
   * operation declares one, and filters the loaded rows otherwise. Defaults
   * to true.
   */
  searchable?: boolean;
  /**
   * Shows filter chips for a `status`/`state` field declared as an enum. The
   * filter is sent to the server when the operation accepts that query param.
   * Defaults to true.
   */
  filterable?: boolean;
  /** Called with the record when a row is clicked; rows become interactive. */
  onRowClick?: (item: JsonObject) => void;
  /** Stable key per record. Defaults to its `id`, else the row index. */
  getRowId?: (item: JsonObject, index: number) => string;
  /** Extra content on the right of the toolbar, e.g. a "New" button. */
  actions?: React.ReactNode;
  /** Replaces the default empty state when the API returns no records. */
  emptyState?: React.ReactNode;
};

const LOADING_ROWS = 5;

const LoadingRows = ({ columnCount }: { columnCount: number }) => {
  return (
    <>
      {Array.from({ length: LOADING_ROWS }, (_, row) => {
        return (
          <TableRow key={row}>
            {Array.from({ length: columnCount }, (__, cell) => {
              return (
                <TableCell key={cell}>
                  <Skeleton className="oa:h-4 oa:w-full oa:max-w-40" />
                </TableCell>
              );
            })}
          </TableRow>
        );
      })}
    </>
  );
};

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

const HeaderCell = ({
  column,
  sort,
}: {
  column: ResolvedColumn;
  sort?: { state: SortState; toggle: (key: string) => void };
}) => {
  const { intl } = useI18n();
  const direction =
    sort?.state?.key === column.key ? sort.state.direction : null;
  const alignClass = column.align === 'right' ? 'oa:text-right' : undefined;

  if (!sort) {
    return <TableHead className={alignClass}>{column.header}</TableHead>;
  }

  return (
    <TableHead
      className={alignClass}
      aria-sort={direction ? ARIA_SORT[direction] : undefined}
    >
      <button
        type="button"
        aria-label={intl.formatMessage(messages.sortBy, {
          column:
            typeof column.header === 'string' ? column.header : column.key,
        })}
        onClick={() => {
          sort.toggle(column.key);
        }}
        className={cn(
          'oa:-mx-1 oa:inline-flex oa:cursor-pointer oa:items-center oa:gap-1 oa:rounded oa:border-0 oa:bg-transparent oa:px-1 oa:py-0.5 oa:text-sm oa:font-medium oa:text-muted-foreground oa:[font-family:inherit] oa:outline-none oa:hover:text-foreground oa:focus-visible:ring-2 oa:focus-visible:ring-ring',
          direction && 'oa:text-foreground'
        )}
      >
        {column.header}
        <SortIcon direction={direction} />
      </button>
    </TableHead>
  );
};

const MessageRow = ({
  columnCount,
  children,
}: {
  columnCount: number;
  children: React.ReactNode;
}) => {
  return (
    <TableRow>
      <TableCell colSpan={columnCount} className="oa:py-12 oa:text-center">
        {children}
      </TableCell>
    </TableRow>
  );
};

const ErrorRow = ({
  columnCount,
  error,
  onRetry,
}: {
  columnCount: number;
  error: Error;
  onRetry: () => void;
}) => {
  const { intl } = useI18n();
  return (
    <MessageRow columnCount={columnCount}>
      <div
        role="alert"
        className="oa:flex oa:flex-col oa:items-center oa:gap-3"
      >
        <div className="oa:flex oa:flex-col oa:gap-1">
          <span className="oa:font-medium oa:text-destructive">
            {intl.formatMessage(messages.errorTitle)}
          </span>
          <span className="oa:text-muted-foreground">{error.message}</span>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {intl.formatMessage(messages.retry)}
        </Button>
      </div>
    </MessageRow>
  );
};

const EmptyRow = ({
  columnCount,
  isFiltered,
  emptyState,
}: {
  columnCount: number;
  isFiltered: boolean;
  emptyState?: React.ReactNode;
}) => {
  const { intl } = useI18n();
  if (!isFiltered && emptyState) {
    return <MessageRow columnCount={columnCount}>{emptyState}</MessageRow>;
  }
  return (
    <MessageRow columnCount={columnCount}>
      <div className="oa:flex oa:flex-col oa:gap-1">
        <span className="oa:font-medium">
          {intl.formatMessage(
            isFiltered ? messages.emptyFilteredTitle : messages.emptyTitle
          )}
        </span>
        {isFiltered && (
          <span className="oa:text-muted-foreground">
            {intl.formatMessage(messages.emptyFilteredHint)}
          </span>
        )}
      </div>
    </MessageRow>
  );
};

const DataRow = ({
  item,
  columns,
  onRowClick,
}: {
  item: JsonObject;
  columns: ResolvedColumn[];
  onRowClick?: (item: JsonObject) => void;
}) => {
  const interactive = onRowClick
    ? {
        tabIndex: 0,
        onClick: () => {
          onRowClick(item);
        },
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onRowClick(item);
          }
        },
      }
    : {};
  return (
    <TableRow
      {...interactive}
      className={cn(
        'oa:hover:bg-muted/40',
        onRowClick &&
          'oa:cursor-pointer oa:outline-none oa:focus-visible:bg-muted/60'
      )}
    >
      {columns.map((column) => {
        const value = item[column.key];
        return (
          <TableCell
            key={column.key}
            className={column.align === 'right' ? 'oa:text-right' : undefined}
          >
            {column.render ? (
              column.render({ value, item })
            ) : (
              <CellValue
                columnKey={column.key}
                value={value}
                schema={column.schema}
              />
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );
};

const BodyRows = ({
  model,
  onRowClick,
  getRowId,
  emptyState,
}: {
  model: ReturnType<typeof useTableModel>;
  onRowClick?: (item: JsonObject) => void;
  getRowId?: (item: JsonObject, index: number) => string;
  emptyState?: React.ReactNode;
}) => {
  const { query, rows, columns } = model;
  const columnCount = Math.max(columns.length, 1);
  if (query.loading) {
    return <LoadingRows columnCount={Math.max(columns.length, 4)} />;
  }
  if (query.error) {
    return (
      <ErrorRow
        columnCount={columnCount}
        error={query.error}
        onRetry={query.refetch}
      />
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyRow
        columnCount={columnCount}
        isFiltered={model.isFiltered}
        emptyState={emptyState}
      />
    );
  }
  return (
    <>
      {rows.map((item, index) => {
        return (
          <DataRow
            key={getRowId ? getRowId(item, index) : String(item.id ?? index)}
            item={item}
            columns={columns}
            onRowClick={onRowClick}
          />
        );
      })}
    </>
  );
};

/**
 * A data table driven by an OpenAPI list operation. It calls the operation,
 * derives the columns and their formatting from the response schema, and adds
 * search, status filters, sorting and pagination — sent to the server when the
 * operation declares the matching query params, done in the browser otherwise.
 * Must be rendered inside an `OpenApiProvider`.
 */
export const OpenApiTable = ({
  operationId,
  params,
  columns,
  maxColumns,
  pageSize,
  pagination,
  searchable,
  filterable,
  onRowClick,
  getRowId,
  actions,
  emptyState,
}: OpenApiTableProps) => {
  const model = useTableModel({
    operationId,
    params,
    columns,
    maxColumns,
    pageSize,
    pagination,
    searchable,
    filterable,
  });
  const { query } = model;
  const settled = !query.error && !query.loading;

  return (
    <div
      className="oa:flex oa:flex-col oa:gap-4 oa:text-sm oa:text-foreground"
      aria-busy={query.fetching}
    >
      <TableToolbar
        search={model.search}
        statusFilter={model.statusFilter}
        fetching={query.fetching}
        onRefresh={query.refetch}
        actions={actions}
      />
      <Table
        aria-label={model.operation?.operation.summary ?? operationId}
        className={cn(
          'oa:transition-opacity',
          query.fetching && !query.loading && 'oa:opacity-60'
        )}
      >
        {model.columns.length > 0 && (
          <TableHeader>
            <TableRow>
              {model.columns.map((column) => {
                return (
                  <HeaderCell
                    key={column.key}
                    column={column}
                    sort={model.sort}
                  />
                );
              })}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          <BodyRows
            model={model}
            onRowClick={onRowClick}
            getRowId={getRowId}
            emptyState={emptyState}
          />
        </TableBody>
      </Table>
      {model.pagination && settled && <TablePagination {...model.pagination} />}
    </div>
  );
};
