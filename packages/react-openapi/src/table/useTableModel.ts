import * as React from 'react';

import { findOperation, hasQueryParameter } from '../core/operations';
import {
  deriveColumns,
  detectServerPagination,
  extractItems,
  extractTotal,
  getListItemSchema,
  humanizeKey,
  matchesSearch,
  paginationParams,
} from '../core/table';
import type {
  JsonObject,
  JsonValue,
  OpenApiSchema,
  OperationParams,
  ResolvedOperation,
} from '../core/types';
import { useOpenApi } from '../OpenApiProvider';
import { useOperationQuery } from '../useOperationQuery';

/**
 * A column of `OpenApiTable`. Give only `key` to keep the default header and
 * formatting; add `header` or `render` to take over either.
 */
export type OpenApiTableColumn = {
  /** Property of each record shown in this column. */
  key: string;
  /** Header content. Defaults to the schema `title`, else the humanized key. */
  header?: React.ReactNode;
  /** Custom cell content. Defaults to formatting driven by the field schema. */
  render?: (args: {
    value: JsonValue | undefined;
    item: JsonObject;
  }) => React.ReactNode;
  /** Horizontal alignment. Numbers align right by default. */
  align?: 'left' | 'right';
};

export type TablePaginationMode = 'auto' | 'client' | 'none';

export type SortState = { key: string; direction: 'asc' | 'desc' } | null;

export type ResolvedColumn = {
  key: string;
  header: React.ReactNode;
  schema?: OpenApiSchema;
  render?: OpenApiTableColumn['render'];
  align: 'left' | 'right';
};

const SEARCH_PARAMS = ['q', 'search', 'query'];

const STATUS_FIELDS = ['status', 'state'];

const SEARCH_DEBOUNCE_MS = 300;

const useDebounced = <T>(value: T, delay: number): T => {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value);
    }, delay);
    return () => {
      clearTimeout(timeout);
    };
  }, [value, delay]);
  return debounced;
};

const isNil = (value: JsonValue | undefined): value is null | undefined => {
  return value === undefined || value === null;
};

/** Ascending order; empty values sort last. */
const compareValues = (a: JsonValue | undefined, b: JsonValue | undefined) => {
  if (a === b) {
    return 0;
  }
  if (isNil(a) || isNil(b)) {
    return isNil(a) ? 1 : -1;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true });
};

const resolveColumn = ({
  def,
  schema,
}: {
  def: OpenApiTableColumn;
  schema?: OpenApiSchema;
}): ResolvedColumn => {
  const numeric = schema?.type === 'number' || schema?.type === 'integer';
  return {
    key: def.key,
    header: def.header ?? schema?.title ?? humanizeKey(def.key),
    schema,
    render: def.render,
    align: def.align ?? (numeric ? 'right' : 'left'),
  };
};

const resolveColumns = ({
  columns,
  itemSchema,
  items,
  maxColumns,
}: {
  columns?: (string | OpenApiTableColumn)[];
  itemSchema?: OpenApiSchema;
  items: JsonObject[];
  maxColumns?: number;
}): ResolvedColumn[] => {
  const defs: OpenApiTableColumn[] = columns
    ? columns.map((column) => {
        return typeof column === 'string' ? { key: column } : column;
      })
    : deriveColumns({ itemSchema, items, maxColumns }).map((key) => {
        return { key };
      });
  return defs.map((def) => {
    return resolveColumn({ def, schema: itemSchema?.properties?.[def.key] });
  });
};

const findStatusField = ({
  itemSchema,
  operation,
}: {
  itemSchema?: OpenApiSchema;
  operation?: ResolvedOperation;
}): { key: string; options: string[]; serverParam?: string } | undefined => {
  for (const key of STATUS_FIELDS) {
    const schema = itemSchema?.properties?.[key];
    if (schema?.enum && schema.enum.length > 0) {
      return {
        key,
        options: schema.enum.map(String),
        serverParam:
          operation && hasQueryParameter({ operation, name: key })
            ? key
            : undefined,
      };
    }
  }
  return undefined;
};

type StatusField = NonNullable<ReturnType<typeof findStatusField>>;

/**
 * What the spec says about the list operation: its record schema, and which
 * of pagination, search and the status filter the server handles.
 */
const useTableSource = ({
  operationId,
  pagination,
  filterable,
}: {
  operationId: string;
  pagination: TablePaginationMode;
  filterable: boolean;
}) => {
  const { spec } = useOpenApi();

  const operation = React.useMemo(() => {
    return spec ? findOperation({ spec, operationId }) : undefined;
  }, [spec, operationId]);

  const itemSchema = React.useMemo(() => {
    return spec && operation
      ? getListItemSchema({ operation, spec })
      : undefined;
  }, [spec, operation]);

  if (!operation) {
    return { operation, itemSchema };
  }

  return {
    operation,
    itemSchema,
    server:
      pagination === 'auto' ? detectServerPagination(operation) : undefined,
    searchParam: SEARCH_PARAMS.find((name) => {
      return hasQueryParameter({ operation, name });
    }),
    statusField: filterable
      ? findStatusField({ itemSchema, operation })
      : undefined,
  };
};

type TableSource = ReturnType<typeof useTableSource>;

/** Page, search, status filter and sort, as the user set them. */
const useTableControls = () => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [search, setSearchState] = React.useState('');
  const [status, setStatusState] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<SortState>(null);

  const setSearch = (value: string) => {
    setSearchState(value);
    setPageIndex(0);
  };

  const setStatus = (value: string | null) => {
    setStatusState(value);
    setPageIndex(0);
  };

  const toggleSort = (key: string) => {
    setSort((current) => {
      if (current?.key !== key) {
        return { key, direction: 'asc' };
      }
      return current.direction === 'asc' ? { key, direction: 'desc' } : null;
    });
  };

  return {
    pageIndex,
    setPageIndex,
    search,
    setSearch,
    status,
    setStatus,
    sort,
    toggleSort,
  };
};

type TableControls = ReturnType<typeof useTableControls>;

/** The params of the list request: the caller's, plus what the server handles. */
const buildRequestParams = ({
  params,
  source,
  controls,
  search,
  pageSize,
}: {
  params?: OperationParams;
  source: TableSource;
  controls: TableControls;
  search: string;
  pageSize: number;
}): OperationParams => {
  const result: OperationParams = { ...params };
  if (source.server) {
    Object.assign(
      result,
      paginationParams({
        pagination: source.server,
        pageIndex: controls.pageIndex,
        pageSize,
      })
    );
  }
  if (source.searchParam && search.trim()) {
    result[source.searchParam] = search.trim();
  }
  if (source.statusField?.serverParam && controls.status) {
    result[source.statusField.serverParam] = controls.status;
  }
  return result;
};

/** Search, status filter and sort that the server does not handle. */
const filterRows = ({
  items,
  source,
  controls,
  searchable,
}: {
  items: JsonObject[];
  source: TableSource;
  controls: TableControls;
  searchable: boolean;
}): JsonObject[] => {
  const { search, status, sort } = controls;
  let rows = items;
  if (searchable && !source.searchParam && search.trim()) {
    rows = rows.filter((item) => {
      return matchesSearch({ item, query: search });
    });
  }
  const statusField = source.statusField as StatusField | undefined;
  if (statusField && !statusField.serverParam && status) {
    rows = rows.filter((item) => {
      return String(item[statusField.key]) === status;
    });
  }
  if (sort && !source.server) {
    rows = [...rows].sort((a, b) => {
      const order = compareValues(a[sort.key], b[sort.key]);
      return sort.direction === 'asc' ? order : -order;
    });
  }
  return rows;
};

const pageInfo = ({
  total,
  pageIndex,
  pageSize,
  loadedCount,
}: {
  total?: number;
  pageIndex: number;
  pageSize: number;
  loadedCount: number;
}) => {
  if (total === undefined) {
    return { pageCount: undefined, hasNextPage: loadedCount === pageSize };
  }
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return { pageCount, hasNextPage: pageIndex + 1 < pageCount };
};

/** Search, status filter and sort controls the table shows. */
const toolbarState = ({
  source,
  controls,
  searchable,
}: {
  source: TableSource;
  controls: TableControls;
  searchable: boolean;
}) => {
  const statusField = source.statusField as StatusField | undefined;
  return {
    isFiltered: controls.search.trim() !== '' || controls.status !== null,
    search: searchable
      ? { value: controls.search, onChange: controls.setSearch }
      : undefined,
    statusFilter: statusField && {
      field: statusField.key,
      options: statusField.options,
      value: controls.status,
      onChange: controls.setStatus,
    },
    sort: source.server
      ? undefined
      : { state: controls.sort, toggle: controls.toggleSort },
  };
};

/**
 * All of `OpenApiTable`'s state and derived data: which request to send
 * (server pagination, search and filter params when the operation declares
 * them) and what to show (client-side search, filter, sort and paging for the
 * rest).
 */
export const useTableModel = ({
  operationId,
  params,
  columns,
  maxColumns,
  pageSize = 10,
  pagination = 'auto',
  searchable = true,
  filterable = true,
}: {
  operationId: string;
  params?: OperationParams;
  columns?: (string | OpenApiTableColumn)[];
  maxColumns?: number;
  pageSize?: number;
  pagination?: TablePaginationMode;
  searchable?: boolean;
  filterable?: boolean;
}) => {
  const source = useTableSource({ operationId, pagination, filterable });
  const controls = useTableControls();
  const debouncedSearch = useDebounced(controls.search, SEARCH_DEBOUNCE_MS);

  const query = useOperationQuery({
    operationId,
    params: buildRequestParams({
      params,
      source,
      controls,
      search: searchable ? debouncedSearch : '',
      pageSize,
    }),
  });

  const items = React.useMemo(() => {
    return extractItems(query.data);
  }, [query.data]);

  const filtered = filterRows({ items, source, controls, searchable });
  const { pageIndex } = controls;
  const rows =
    source.server || pagination === 'none'
      ? filtered
      : filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const total = source.server ? extractTotal(query.data) : filtered.length;

  const resolvedColumns = React.useMemo(() => {
    return resolveColumns({
      columns,
      itemSchema: source.itemSchema,
      items,
      maxColumns,
    });
  }, [columns, source.itemSchema, items, maxColumns]);

  return {
    operation: source.operation,
    query,
    rows,
    columns: resolvedColumns,
    ...toolbarState({ source, controls, searchable }),
    pagination:
      pagination === 'none'
        ? undefined
        : {
            pageIndex,
            pageSize,
            total,
            rowCount: rows.length,
            onPageChange: controls.setPageIndex,
            ...pageInfo({
              total,
              pageIndex,
              pageSize,
              loadedCount: items.length,
            }),
          },
  };
};
